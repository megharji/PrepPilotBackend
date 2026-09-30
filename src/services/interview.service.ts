import { pool } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import type { CreateInterviewInput, Interview } from "../types/interview.types.js";

// Naya interview hamesha SETUP status se shuru hota hai (DB default)
export const createInterview = async (input: CreateInterviewInput): Promise<Interview> => {
    // Resume diya hai to wo isi user ka hona chahiye, kisi aur ka resume attach nahi kar sakte
    if (input.resumeId) {
        const owned = await pool.query("SELECT id FROM resumes WHERE id = $1 AND user_id = $2", [
            input.resumeId,
            input.userId,
        ]);
        if (!owned.rowCount) {
            throw new ApiError(404, "Resume not found");
        }
    }

    try {
        const result = await pool.query<Interview>(
            `INSERT INTO interviews (user_id, target_role, experience_years, job_description, resume_id, interview_type, difficulty)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, user_id AS "userId", target_role AS "targetRole",
                       experience_years AS "experienceYears", job_description AS "jobDescription",
                       resume_id AS "resumeId", interview_type AS "interviewType", difficulty, status,
                       created_at AS "createdAt"`,
            [
                input.userId,
                input.targetRole,
                input.experienceYears,
                input.jobDescription,
                input.resumeId,
                input.interviewType,
                input.difficulty,
            ]
        );
        return result.rows[0]!;
    } catch (err: any) {
        // Foreign key violation: check ke baad insert se pehle user ya resume delete ho gaya
        if (err.code === "23503") {
            const missing = err.constraint === "interviews_resume_id_fkey" ? "Resume" : "User";
            throw new ApiError(404, `${missing} not found`);
        }
        throw err;
    }
};
