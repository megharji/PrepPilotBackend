import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

export const notFound = (req: Request, res: Response) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

const multerMessages: Partial<Record<multer.ErrorCode, string>> = {
    LIMIT_FILE_SIZE: "File too large (max 5 MB)",
    LIMIT_FILE_COUNT: "Only one file can be uploaded",
    LIMIT_UNEXPECTED_FILE: "Unexpected file field (use form-data field: resume)",
};

// Express 5 async handlers ke thrown errors automatically yahan aate hain
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }

    // Upload ki galtiyan (size, field name) client ki galti hai, 500 nahi
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: multerMessages[err.code] ?? err.message });
    }

    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
};
