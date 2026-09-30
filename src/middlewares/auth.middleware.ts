import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.js";

// Header format: Authorization: Bearer <token>
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        throw new ApiError(401, "Authorization token missing");
    }

    const token = header.slice(7).trim();
    if (!token) {
        throw new ApiError(401, "Authorization token missing");
    }

    try {
        req.user = verifyToken(token);
    } catch {
        // Expired, tampered ya galat secret se bana token, sab yahan pakde jaate hain
        throw new ApiError(401, "Invalid or expired token");
    }

    next();
};
