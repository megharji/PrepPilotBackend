import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

// Ek jawab ki recording. Browser opus/webm me ~1 MB per 2-3 min banata hai, 10 MB kaafi hai
// (Groq free tier ki limit 25 MB hai)
export const MAX_AUDIO_SIZE = 10 * 1024 * 1024;

// Browser alag alag format bhejte hain: Chrome/Edge webm, Firefox ogg, Safari mp4
const isAudio = (mimetype: string) => mimetype.startsWith("audio/") || mimetype === "video/webm";

// File memory me rakhte hain, disk pe save nahi hoti; sirf Groq ko bhej ke text lete hain
export const uploadAudio = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_AUDIO_SIZE, files: 1 },
    fileFilter: (_req, file, cb) => {
        if (!isAudio(file.mimetype)) {
            return cb(new ApiError(400, "Only audio recordings are allowed"));
        }
        cb(null, true);
    },
}).single("audio");
