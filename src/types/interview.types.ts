import type { Report } from "./ai.types.js";

export const INTERVIEW_TYPES =["TECHNICAL", "BEHAVIORAL", "HR", "MIXED", "CODING"] as const;
// AUTO = user ne choose nahi kiya, AI experience ke hisaab se khud decide karega
// Coding round me bhi yahi values; frontend inhe Basic / Medium / Hard dikhata hai
export const DIFFICULTIES = ["AUTO", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const INTERVIEW_STATUSES = ["SETUP", "IN_PROGRESS", "COMPLETED"] as const;

export type InterviewType = (typeof INTERVIEW_TYPES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export interface CreateInterviewInput {
    userId: number;
    targetRole: string;
    experienceYears: number;
    // Language / framework (React, Java, MERN...), list se ya user ka khud likha
    techStack: string | null;
    jobDescription: string | null;
    resumeId: number | null;
    interviewType: InterviewType;
    difficulty: Difficulty;
}

export interface Interview {
    id: number;
    userId: number;
    targetRole: string;
    experienceYears: number;
    techStack: string | null;
    jobDescription: string | null;
    resumeId: number | null;
    interviewType: InterviewType;
    difficulty: Difficulty;
    status: InterviewStatus;
    createdAt: Date;
    // AI score (report.overall); jab tak interview poora na ho, null
    overallScore: number | null;
    completedAt: Date | null;
    durationSec: number | null;
}

// GET /interviews/:id: list wale fields + poori AI report
export interface InterviewDetail extends Interview {
    report: Report | null;
}
