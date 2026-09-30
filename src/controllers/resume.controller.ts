import type { Request, Response } from "express";
import { saveResume } from "../services/resume.service.js";
import { ApiError } from "../utils/ApiError.js";

export const uploadResumeHandler = async (req: Request, res: Response) => {
    // authenticate middleware ke baad hi ye chalta hai
    if (!req.user) {
        throw new ApiError(401, "Not authenticated");
    }
    if (!req.file) {
        throw new ApiError(400, "Resume file is required (form-data field: resume)");
    }

    const resume = await saveResume({ userId: req.user.id, file: req.file });

    res.status(201).json({
        success: true,
        message: "Resume uploaded successfully",
        data: resume,
    });
};
