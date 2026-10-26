import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { isAiConfigured } from "./ai.service.js";

// Groq ka OpenAI-compatible speech-to-text (Whisper). Docs: https://console.groq.com/docs/speech-to-text
const GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const STT_TIMEOUT_MS = 30_000;

interface TranscribeInput {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
}

// Recording -> text. Text sirf AI scoring ke liye; user ko voice note hi dikhta hai.
export const transcribeAudio = async ({ buffer, mimetype, originalname }: TranscribeInput): Promise<string> => {
    if (!isAiConfigured()) {
        throw new ApiError(503, "AI is not configured on the server");
    }

    const form = new FormData();
    // Groq file extension se format pehchanta hai, isliye naam me sahi extension zaroori
    form.append("file", new Blob([new Uint8Array(buffer)], { type: mimetype }), originalname || "answer.webm");
    form.append("model", env.GROQ_STT_MODEL);
    form.append("language", "en");
    form.append("response_format", "json");
    // Interview ka context: technical words (React, useEffect, Node.js) sahi likhe jaate hain
    form.append("prompt", "A candidate answering a software engineering interview question.");

    let response: Response;
    try {
        response = await fetch(GROQ_STT_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
            body: form,
            signal: AbortSignal.timeout(STT_TIMEOUT_MS),
        });
    } catch (err) {
        console.error("Groq transcription request failed:", err);
        throw new ApiError(502, "Couldn't process your recording right now. Please try again.");
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.error(`Groq transcription error ${response.status}:`, detail.slice(0, 500));
        if (response.status === 429) {
            throw new ApiError(429, "AI is busy right now (free limit reached). Please try again in a minute.");
        }
        if (response.status === 400) {
            throw new ApiError(400, "This recording couldn't be read. Please record again.");
        }
        throw new ApiError(503, "Voice answers are not available right now. Please type your answer.");
    }

    const data = (await response.json()) as { text?: string };
    return (data.text ?? "").trim();
};
