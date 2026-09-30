import type { Request, Response } from "express";
import { loginUser, registerUser } from "../services/auth.service.js";
import { ApiError } from "../utils/ApiError.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const { user, token } = await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
    });

    // Response login jaisa hi: { user, token }
    res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: { user, token },
    });
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

    const { user, token } = await loginUser({
        email: email.trim().toLowerCase(),
        password,
    });

    res.status(200).json({
        success: true,
        message: "Login successful",
        data: { user, token },
    });
};
