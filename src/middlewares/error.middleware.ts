import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";

export const notFound = (req: Request, res: Response) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

// Express 5 async handlers ke thrown errors automatically yahan aate hain
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }

    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
};
