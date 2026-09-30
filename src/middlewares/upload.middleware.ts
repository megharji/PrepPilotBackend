import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

export const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5 MB

export const RESUME_MIME_TYPES: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

// File memory me rakhte hain, taaki disk pe likhne se pehle content check kar sakein
export const uploadResume = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_RESUME_SIZE, files: 1 },
    fileFilter: (_req, file, cb) => {
        if (!RESUME_MIME_TYPES[file.mimetype]) {
            return cb(new ApiError(400, "Only PDF or DOCX files are allowed"));
        }
        cb(null, true);
    },
}).single("resume");
