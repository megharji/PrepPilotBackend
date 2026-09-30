import type { Request, Response } from "express";
import { getUserById } from "../services/user.service.js";
import { ApiError } from "../utils/ApiError.js";

export const getProfile = async (req: Request, res: Response) => {
    // authenticate middleware ke baad hi ye chalta hai
    if (!req.user) {
        throw new ApiError(401, "Not authenticated");
    }

    const user = await getUserById(req.user.id);

    res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        data: user,
    });
};
