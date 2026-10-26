import type { Request, Response } from "express";
import { getInterviewById } from "../services/interview.service.js";
import { transcribeAudio } from "../services/transcribe.service.js";
import { ApiError } from "../utils/ApiError.js";

export const transcribeAnswerHandler = async (req: Request, res: Response) => {
    // authenticate middleware ke baad hi ye chalta hai
    if (!req.user) {
        throw new ApiError(401, "Not authenticated");
    }

    // URL se id string aati hai; sirf digits wali hi maante hain
    const rawId = req.params.id;
    const id = typeof rawId === "string" && /^\d+$/.test(rawId) ? Number(rawId) : NaN;
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new ApiError(400, "Interview id is invalid");
    }

    // Sirf apne interview ke liye (kisi aur ka ho to 404), taaki koi free me transcription na chalaye
    await getInterviewById(id, req.user.id);

    if (!req.file) {
        throw new ApiError(400, "Recording is required (form-data field: audio)");
    }

    const text = await transcribeAudio(req.file);
    if (!text) {
        throw new ApiError(422, "We couldn't hear anything in that recording. Please try again closer to the mic.");
    }

    res.status(200).json({
        success: true,
        message: "Answer transcribed successfully",
        data: { text },
    });
};
