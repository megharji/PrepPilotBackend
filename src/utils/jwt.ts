import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
    id: string;
    email: string;
}

export const generateToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as NonNullable<jwt.SignOptions["expiresIn"]>,
    });
};

// Token verify karke payload return karta hai; invalid/expired token pe error throw hota hai
export const verifyToken = (token: string): JwtPayload => {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === "string" || typeof decoded.id !== "string" || typeof decoded.email !== "string") {
        throw new jwt.JsonWebTokenError("Invalid token payload");
    }
    return { id: decoded.id, email: decoded.email };
};
