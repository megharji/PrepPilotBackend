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
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
};
