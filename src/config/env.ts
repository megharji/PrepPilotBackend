import dotenv from "dotenv";

dotenv.config();

const required = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing environment variable: ${key} (.env me add karo)`);
    }
    return value;
};

export const env = {
    PORT: Number(process.env.PORT) || 5000,
    DATABASE_URL: required("DATABASE_URL"),
    JWT_SECRET: required("JWT_SECRET"),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
    // AI (Groq): interview ke sawaal aur score isi se. Key na ho to server chalta hai, par AI wale
    // routes 503 dete hain aur interview shuru nahi hota. Key: https://console.groq.com/keys
    GROQ_API_KEY: process.env.GROQ_API_KEY ?? "",
    // Groq models badalte rehte hain; list: https://console.groq.com/docs/models
    GROQ_MODEL: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
    // Voice answers ka speech-to-text (Groq Whisper)
    GROQ_STT_MODEL: process.env.GROQ_STT_MODEL ?? "whisper-large-v3-turbo",
};
