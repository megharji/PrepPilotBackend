import dotenv from "dotenv";

dotenv.config();

const required = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing environment variable: ${key} (.env me add karo)`);
    }
    return value;
};

export const env = {
    PORT: Number(process.env.PORT) || 5000,
    DATABASE_URL: required("DATABASE_URL"),
    JWT_SECRET: required("JWT_SECRET"),
    // Access token chhota rakhte hain; expire hone pe refresh token (cookie) se naya milta hai
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "15m",
    // Refresh token kitne din chale (itne din login na kare to dobara login)
    REFRESH_TOKEN_DAYS: Number(process.env.REFRESH_TOKEN_DAYS) || 30,
    // Frontend ka URL (comma se kai). Cookie bhejne ke liye CORS me exact origin chahiye, "*" nahi chalta
    CLIENT_ORIGINS: (process.env.CLIENT_ORIGIN ?? "http://localhost:5173").split(",").map((o) => o.trim()),
    // Production (https, frontend alag domain pe): COOKIE_SECURE=true aur COOKIE_SAMESITE=none
    COOKIE_SECURE: process.env.COOKIE_SECURE === "true",
    COOKIE_SAMESITE: (process.env.COOKIE_SAMESITE ?? "lax") as "lax" | "strict" | "none",
    // AI (Groq): interview ke sawaal aur score isi se. Key na ho to server chalta hai, par AI wale
    // routes 503 dete hain aur interview shuru nahi hota. Key: https://console.groq.com/keys
    GROQ_API_KEY: process.env.GROQ_API_KEY ?? "",
    // Groq models badalte rehte hain; list: https://console.groq.com/docs/models
    GROQ_MODEL: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
    // Voice answers ka speech-to-text (Groq Whisper)
    GROQ_STT_MODEL: process.env.GROQ_STT_MODEL ?? "whisper-large-v3-turbo",
};
