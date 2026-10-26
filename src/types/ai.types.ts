// AI ke banaye sawaal aur report. Shape frontend ke DemoQuestion / DemoReport jaisa hi,
// taaki interview room aur report page bina badle chal sakein.

export interface KeyPoint {
    label: string;
    // Fallback scoring (AI fail ho) ke liye; jawab me inme se koi word ho to point covered
    keywords: string[];
}

export interface Turn {
    question: string;
    keyPoints: KeyPoint[];
    ideal: string;
}

export interface Question extends Turn {
    id: string;
    topic: string;
    followUps: Turn[];
}

// Frontend se aaya ek jawab. Sawaal ka text client se nahi lete, DB me save sawaal se milate hain.
export interface SubmittedAnswer {
    questionIndex: number;
    isFollowUp: boolean;
    answer: string;
    skipped: boolean;
}

export interface TurnResult {
    topic: string;
    isFollowUp: boolean;
    turn: Turn;
    answer: string;
    skipped: boolean;
    covered: KeyPoint[];
    missed: KeyPoint[];
    score: number;
    feedback: string;
    // Is jawab me kya achha tha / kya sudhaarna hai
    strengths: string[];
    improvements: string[];
    // User ke apne jawab ko behtar bana ke likha hua version (skip kiya to khaali)
    betterAnswer: string;
}

export interface Report {
    overall: number;
    skills: { label: string; score: number }[];
    turns: TurnResult[];
    // Poore interview ka 2-3 line ka nichod, aur kin cheezon pe kaam karna hai
    summary: string;
    strengths: string[];
    focusAreas: string[];
}
