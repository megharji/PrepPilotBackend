import { pool } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { extractResumeText } from "../utils/resumeText.js";
import { generateQuestions, scoreAnswers } from "./ai.service.js";
import type { Question, SubmittedAnswer } from "../types/ai.types.js";
import type { CreateInterviewInput, Interview, InterviewDetail } from "../types/interview.types.js";

// DB columns -> API ke camelCase naam (sab queries me same)
const INTERVIEW_COLUMNS = `id, user_id AS "userId", target_role AS "targetRole",
    experience_years AS "experienceYears", tech_stack AS "techStack", job_description AS "jobDescription",
    resume_id AS "resumeId", interview_type AS "interviewType", difficulty, status,
    created_at AS "createdAt", (report->>'overall')::float AS "overallScore",
    completed_at AS "completedAt", duration_sec AS "durationSec"`;

// Detail me poori report bhi (list me nahi, wo bhaari hai)
const DETAIL_COLUMNS = `${INTERVIEW_COLUMNS}, report`;

// Logged-in user ke saare interviews, naye sabse upar
export const getInterviewsByUser = async (userId: number): Promise<Interview[]> => {
    const result = await pool.query<Interview>(
        `SELECT ${INTERVIEW_COLUMNS} FROM interviews WHERE user_id = $1 ORDER BY created_at DESC, id DESC`,
        [userId]
    );
    return result.rows;
};

// Ek interview, sirf apna. Kisi aur ka ho ya exist na kare, dono me 404
// (403 dete to pata chal jaata ki ye id kisi aur ki hai)
export const getInterviewById = async (id: number, userId: number): Promise<InterviewDetail> => {
    const result = await pool.query<InterviewDetail>(
        `SELECT ${DETAIL_COLUMNS} FROM interviews WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
    const interview = result.rows[0];
    if (!interview) {
        throw new ApiError(404, "Interview not found");
    }
    return interview;
};

// Apna interview delete. Kisi aur ka ho ya exist na kare, dono me 404
export const deleteInterview = async (id: number, userId: number): Promise<void> => {
    const result = await pool.query("DELETE FROM interviews WHERE id = $1 AND user_id = $2", [id, userId]);
    if (!result.rowCount) {
        throw new ApiError(404, "Interview not found");
    }
};

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
            `INSERT INTO interviews (user_id, target_role, experience_years, tech_stack, job_description, resume_id, interview_type, difficulty)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING ${INTERVIEW_COLUMNS}`,
            [
                input.userId,
                input.targetRole,
                input.experienceYears,
                input.techStack,
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

// ---------- AI: sawaal aur score ----------

interface InterviewAiRow {
    id: number;
    target_role: string;
    tech_stack: string | null;
    experience_years: number;
    interview_type: Interview["interviewType"];
    difficulty: Interview["difficulty"];
    job_description: string | null;
    status: Interview["status"];
    questions: Question[] | null;
    resume_path: string | null;
    resume_mime: string | null;
}

// Apna interview + uske sawaal + resume file (kisi aur ka ho to 404)
const getAiRow = async (id: number, userId: number): Promise<InterviewAiRow> => {
    const result = await pool.query<InterviewAiRow>(
        `SELECT i.id, i.target_role, i.tech_stack, i.experience_years, i.interview_type, i.difficulty,
                i.job_description, i.status, i.questions,
                r.file_path AS resume_path, r.mime_type AS resume_mime
         FROM interviews i
         LEFT JOIN resumes r ON r.id = i.resume_id
         WHERE i.id = $1 AND i.user_id = $2`,
        [id, userId]
    );
    const row = result.rows[0];
    if (!row) {
        throw new ApiError(404, "Interview not found");
    }
    return row;
};

// AI se sawaal banwao (role, tech, experience, JD, resume ke hisaab se) aur interview IN_PROGRESS.
// Pehle se bane hon to wahi wapas: page refresh pe naye sawaal nahi aate aur free limit bhi nahi jaati.
export const prepareQuestions = async (id: number, userId: number): Promise<Question[]> => {
    const row = await getAiRow(id, userId);
    if (row.status === "COMPLETED") {
        throw new ApiError(409, "This interview is already completed");
    }
    if (row.questions?.length) {
        return row.questions;
    }

    const resumeText =
        row.resume_path && row.resume_mime ? await extractResumeText(row.resume_path, row.resume_mime) : null;

    const questions = await generateQuestions({
        targetRole: row.target_role,
        techStack: row.tech_stack,
        experienceYears: row.experience_years,
        interviewType: row.interview_type,
        difficulty: row.difficulty,
        jobDescription: row.job_description,
        resumeText,
    });

    // Do request ek saath aayi hon to jo pehle save hua wahi rahega
    const saved = await pool.query<{ questions: Question[] }>(
        `UPDATE interviews SET questions = COALESCE(questions, $1::jsonb), status = 'IN_PROGRESS'
         WHERE id = $2 AND user_id = $3
         RETURNING questions`,
        [JSON.stringify(questions), id, userId]
    );
    return saved.rows[0]?.questions ?? questions;
};

// Jawab AI se check karwao, report save karo, interview COMPLETED
export const submitInterview = async (
    id: number,
    userId: number,
    answers: SubmittedAnswer[],
    durationSec: number
): Promise<InterviewDetail> => {
    const row = await getAiRow(id, userId);
    if (row.status === "COMPLETED") {
        throw new ApiError(409, "This interview is already completed");
    }
    if (!row.questions?.length) {
        throw new ApiError(409, "Questions for this interview were not generated");
    }

    const report = await scoreAnswers(row.questions, answers);

    // Score karte waqt doosri request ne complete kar diya ho to dobara nahi
    const result = await pool.query<InterviewDetail>(
        `UPDATE interviews
         SET report = $1::jsonb, status = 'COMPLETED', completed_at = NOW(), duration_sec = $2
         WHERE id = $3 AND user_id = $4 AND status <> 'COMPLETED'
         RETURNING ${DETAIL_COLUMNS}`,
        [JSON.stringify(report), durationSec, id, userId]
    );
    const updated = result.rows[0];
    if (!updated) {
        throw new ApiError(409, "This interview is already completed");
    }
    return updated;
};
