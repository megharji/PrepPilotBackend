import type { Request, Response } from "express";
import {
    createInterview,
    deleteInterview,
    getInterviewById,
    getInterviewsByUser,
    prepareQuestions,
    submitInterview,
} from "../services/interview.service.js";
import type { SubmittedAnswer } from "../types/ai.types.js";
import { DIFFICULTIES, INTERVIEW_TYPES } from "../types/interview.types.js";
import { ApiError } from "../utils/ApiError.js";

const MAX_JD_LENGTH = 10000;
const MAX_TECH_STACK_LENGTH = 50;
// Postgres INTEGER ki max value; isse bada number DB error (500) deta
const MAX_DB_ID = 2147483647;

const isValidId = (value: unknown): value is number =>
    Number.isInteger(value) && (value as number) > 0 && (value as number) <= MAX_DB_ID;

// URL se id string aati hai; sirf digits wali hi maante hain ("12abc", "1.5" nahi)
const parseInterviewId = (req: Request): number => {
    const rawId = req.params.id;
    const id = typeof rawId === "string" && /^\d+$/.test(rawId) ? Number(rawId) : NaN;
    if (!isValidId(id)) {
        throw new ApiError(400, "Interview id is invalid");
    }
    return id;
};

const isEmpty = (value: unknown) => value === undefined || value === null || value === "";

const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
    typeof value === "string" && (list as readonly string[]).includes(value);

export const createInterviewHandler = async (req: Request, res: Response) => {
    // authenticate middleware ke baad hi ye chalta hai
    if (!req.user) {
        throw new ApiError(401, "Not authenticated");
    }

    const { targetRole, experienceYears, techStack, jobDescription, resumeId, interviewType, difficulty } =
        req.body ?? {};

    // Validation
    if (typeof targetRole !== "string" || !targetRole.trim() || targetRole.trim().length > 100) {
        throw new ApiError(400, "Target role is required (max 100 characters)");
    }
    if (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 50) {
        throw new ApiError(400, "Experience years must be a whole number between 0 and 50");
    }
    // Tech stack optional hai (React, Java, ya user ka khud likha); bheja hai to chhota text
    if (!isEmpty(techStack) && (typeof techStack !== "string" || techStack.trim().length > MAX_TECH_STACK_LENGTH)) {
        throw new ApiError(400, `Tech stack must be text (max ${MAX_TECH_STACK_LENGTH} characters)`);
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
        techStack: typeof techStack === "string" && techStack.trim() ? techStack.trim() : null,
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

export const getInterviewsHandler = async (req: Request, res: Response) => {
    // authenticate middleware ke baad hi ye chalta hai
    if (!req.user) {
        throw new ApiError(401, "Not authenticated");
    }

    const interviews = await getInterviewsByUser(req.user.id);

    res.status(200).json({
        success: true,
        message: "Interviews fetched successfully",
        data: interviews,
    });
};

export const getInterviewHandler = async (req: Request, res: Response) => {
    // authenticate middleware ke baad hi ye chalta hai
    if (!req.user) {
        throw new ApiError(401, "Not authenticated");
    }

    const interview = await getInterviewById(parseInterviewId(req), req.user.id);

    res.status(200).json({
        success: true,
        message: "Interview fetched successfully",
        data: interview,
    });
};

// POST /interviews/:id/questions: AI se sawaal (pehle se bane hon to wahi)
export const prepareQuestionsHandler = async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, "Not authenticated");
    }

    const questions = await prepareQuestions(parseInterviewId(req), req.user.id);

    res.status(200).json({
        success: true,
        message: "Questions ready",
        data: questions,
    });
};

const MAX_ANSWERS = 20;
const MAX_ANSWER_LENGTH = 5000;
const MAX_DURATION_SEC = 6 * 60 * 60;

const isAnswer = (a: unknown): a is SubmittedAnswer => {
    const v = a as Record<string, unknown> | null;
    return (
        !!v &&
        Number.isInteger(v.questionIndex) &&
        (v.questionIndex as number) >= 0 &&
        (v.questionIndex as number) < MAX_ANSWERS &&
        typeof v.isFollowUp === "boolean" &&
        typeof v.skipped === "boolean" &&
        typeof v.answer === "string" &&
        v.answer.length <= MAX_ANSWER_LENGTH
    );
};

// POST /interviews/:id/submit: jawab AI se check, report save, interview COMPLETED
export const submitInterviewHandler = async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, "Not authenticated");
    }

    const id = parseInterviewId(req);
    const { answers, durationSec } = req.body ?? {};

    if (!Array.isArray(answers) || !answers.length || answers.length > MAX_ANSWERS || !answers.every(isAnswer)) {
        throw new ApiError(400, `Answers are invalid (1-${MAX_ANSWERS} answers, each up to ${MAX_ANSWER_LENGTH} characters)`);
    }
    if (!Number.isInteger(durationSec) || durationSec < 0 || durationSec > MAX_DURATION_SEC) {
        throw new ApiError(400, "Duration is invalid");
    }

    const interview = await submitInterview(
        id,
        req.user.id,
        answers.map((a: SubmittedAnswer) => ({ ...a, answer: a.answer.trim() })),
        durationSec
    );

    res.status(200).json({
        success: true,
        message: "Interview scored successfully",
        data: interview,
    });
};

export const deleteInterviewHandler = async (req: Request, res: Response) => {
    // authenticate middleware ke baad hi ye chalta hai
    if (!req.user) {
        throw new ApiError(401, "Not authenticated");
    }

    const id = parseInterviewId(req);
    await deleteInterview(id, req.user.id);

    res.status(200).json({
        success: true,
        message: "Interview deleted successfully",
        data: { id },
    });
};
