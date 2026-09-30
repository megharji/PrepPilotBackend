export const INTERVIEW_TYPES = ["TECHNICAL", "BEHAVIORAL", "HR", "MIXED"] as const;
// AUTO = user ne choose nahi kiya, AI experience ke hisaab se khud decide karega
export const DIFFICULTIES = ["AUTO", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const INTERVIEW_STATUSES = ["SETUP", "IN_PROGRESS", "COMPLETED"] as const;

export type InterviewType = (typeof INTERVIEW_TYPES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export interface CreateInterviewInput {
    userId: number;
    targetRole: string;
    experienceYears: number;
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
    jobDescription: string | null;
    resumeId: number | null;
    interviewType: InterviewType;
    difficulty: Difficulty;
    status: InterviewStatus;
    createdAt: Date;
}
