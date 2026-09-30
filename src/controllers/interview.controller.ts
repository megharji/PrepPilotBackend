import type { Request, Response } from "express";
import { createInterview } from "../services/interview.service.js";
import { DIFFICULTIES, INTERVIEW_TYPES } from "../types/interview.types.js";
import { ApiError } from "../utils/ApiError.js";

const MAX_JD_LENGTH = 10000;
// Postgres INTEGER ki max value; isse bada number DB error (500) deta
const MAX_DB_ID = 2147483647;

const isValidId = (value: unknown): value is number =>
    Number.isInteger(value) && (value as number) > 0 && (value as number) <= MAX_DB_ID;

const isEmpty = (value: unknown) => value === undefined || value === null || value === "";

const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
    typeof value === "string" && (list as readonly string[]).includes(value);

export const createInterviewHandler = async (req: Request, res: Response) => {
    // authenticate middleware ke baad hi ye chalta hai
    if (!req.user) {
        throw new ApiError(401, "Not authenticated");
    }

    const { targetRole, experienceYears, jobDescription, resumeId, interviewType, difficulty } = req.body ?? {};

    // Validation
    if (typeof targetRole !== "string" || !targetRole.trim() || targetRole.trim().length > 100) {
        throw new ApiError(400, "Target role is required (max 100 characters)");
    }
    if (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 50) {
        throw new ApiError(400, "Experience years must be a whole number between 0 and 50");
    }
    // JD optional hai; bheja hai to string honi chahiye
    if (jobDescription !== undefined && jobDescription !== null && typeof jobDescription !== "string") {
        throw new ApiError(400, "Job description must be text");
    }
    if (typeof jobDescription === "string" && jobDescription.trim().length > MAX_JD_LENGTH) {
        throw new ApiError(400, `Job description is too long (max ${MAX_JD_LENGTH} characters)`);
    }
    if (!isOneOf(INTERVIEW_TYPES, interviewType)) {
        throw new ApiError(400, `Interview type must be one of: ${INTERVIEW_TYPES.join(", ")}`);
    }
    // Difficulty optional hai; nahi bheji to AUTO
    if (!isEmpty(difficulty) && !isOneOf(DIFFICULTIES, difficulty)) {
        throw new ApiError(400, `Difficulty must be one of: ${DIFFICULTIES.join(", ")}`);
    }
    // Resume optional hai; pehle POST /api/resumes se upload karke uski id yahan bhejo
    if (!isEmpty(resumeId) && !isValidId(resumeId)) {
        throw new ApiError(400, "Resume id is invalid");
    }

    const interview = await createInterview({
        userId: req.user.id,
        targetRole: targetRole.trim(),
        experienceYears,
        jobDescription: typeof jobDescription === "string" && jobDescription.trim() ? jobDescription.trim() : null,
        resumeId: isEmpty(resumeId) ? null : resumeId,
        interviewType,
        difficulty: isEmpty(difficulty) ? "AUTO" : difficulty,
    });

    res.status(201).json({
        success: true,
        message: "Interview created successfully",
        data: interview,
    });
};
