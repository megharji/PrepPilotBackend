import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pool } from "../config/db.js";
import { RESUME_MIME_TYPES } from "../middlewares/upload.middleware.js";
import { ApiError } from "../utils/ApiError.js";
import type { Resume } from "../types/resume.types.js";

const RESUME_DIR = "uploads/resumes";

// Mimetype client bhejta hai, usko fake kiya ja sakta hai; isliye file ke starting bytes check karte hain
// PDF "%PDF-" se shuru hota hai, DOCX ek zip hai jo "PK\x03\x04" se shuru hota hai
const hasValidSignature = (buffer: Buffer, ext: string): boolean => {
    if (ext === "pdf") return buffer.subarray(0, 5).toString("latin1") === "%PDF-";
    if (ext === "docx") return buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    return false;
};

interface SaveResumeInput {
    userId: number;
    file: Express.Multer.File;
}

export const saveResume = async ({ userId, file }: SaveResumeInput): Promise<Resume> => {
    const ext = RESUME_MIME_TYPES[file.mimetype];
    if (!ext || !hasValidSignature(file.buffer, ext)) {
        throw new ApiError(400, "File content is not a valid PDF or DOCX");
    }

    // Disk pe apna random naam, user ka diya naam sirf DB me (path traversal se bachne ke liye)
    await fs.mkdir(RESUME_DIR, { recursive: true });
    const filePath = path.posix.join(RESUME_DIR, `${randomUUID()}.${ext}`);
    await fs.writeFile(filePath, file.buffer);

    try {
        const result = await pool.query<Resume>(
            `INSERT INTO resumes (user_id, original_name, file_path, mime_type, size_bytes)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, user_id AS "userId", original_name AS "originalName",
                       mime_type AS "mimeType", size_bytes AS "sizeBytes", created_at AS "createdAt"`,
            [userId, file.originalname, filePath, file.mimetype, file.size]
        );
        return result.rows[0]!;
    } catch (err: any) {
        // DB save fail hua to file bhi hata do, warna disk pe bekaar file padi rahegi
        await fs.unlink(filePath).catch(() => {});
        // Token valid hai par user delete ho chuka ho (foreign key violation)
        if (err.code === "23503") {
            throw new ApiError(404, "User not found");
        }
        throw err;
    }
};
