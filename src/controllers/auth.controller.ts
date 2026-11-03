import type { CookieOptions, Request, Response } from "express";
import { env } from "../config/env.js";
import { loginUser, refreshSession, registerUser } from "../services/auth.service.js";
import type { Session } from "../services/auth.service.js";
import { revokeRefreshToken } from "../services/refreshToken.service.js";
import { ApiError } from "../utils/ApiError.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Refresh token httpOnly cookie me: JavaScript (aur XSS) ise padh nahi sakti.
// path /api/auth: sirf auth routes pe jaati hai, baaki har API request ke saath nahi.
const REFRESH_COOKIE = "pp_refresh";
const refreshCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: "/api/auth",
};

// Cookie set karo, body me sirf user + access token (refresh token body me kabhi nahi)
const sendSession = (res: Response, status: number, message: string, session: Session) => {
    res.cookie(REFRESH_COOKIE, session.refreshToken, {
        ...refreshCookieOptions,
        maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    });
    res.status(status).json({
        success: true,
        message,
        data: { user: session.user, token: session.token },
    });
};

const readRefreshCookie = (req: Request): string | null => {
    const value = req.cookies?.[REFRESH_COOKIE];
    return typeof value === "string" && value ? value : null;
};

export const register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body ?? {};

    // Validation
    if (typeof name !== "string" || !name.trim()) {
        throw new ApiError(400, "Name is required");
    }
    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        throw new ApiError(400, "Valid email is required");
    }
    if (typeof password !== "string" || password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters");
    }

    const session = await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
    });

    // Response login jaisa hi: { user, token }
    sendSession(res, 201, "User registered successfully", session);
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};

    // Validation
    if (typeof email !== "string" || !email.trim()) {
        throw new ApiError(400, "Email is required");
    }
    if (typeof password !== "string" || !password) {
        throw new ApiError(400, "Password is required");
    }

    const session = await loginUser({
        email: email.trim().toLowerCase(),
        password,
    });

    sendSession(res, 200, "Login successful", session);
};

// POST /auth/refresh: cookie wala refresh token -> naya access token (aur nayi cookie)
export const refresh = async (req: Request, res: Response) => {
    const token = readRefreshCookie(req);
    if (!token) {
        throw new ApiError(401, "Session expired. Please log in again.");
    }

    try {
        sendSession(res, 200, "Session refreshed", await refreshSession(token));
    } catch (err) {
        // Kharab / expire / chori wala token: cookie bhi hata do
        res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
        if (err instanceof ApiError && err.statusCode === 404) {
            throw new ApiError(401, "Session expired. Please log in again.");
        }
        throw err;
    }
};

// POST /auth/logout: is device ka refresh token band + cookie hata do
export const logout = async (req: Request, res: Response) => {
    const token = readRefreshCookie(req);
    if (token) {
        await revokeRefreshToken(token);
    }
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
    res.status(200).json({ success: true, message: "Logged out" });
};
