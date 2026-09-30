import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
    id: number;
    email: string;
}

export const generateToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as NonNullable<jwt.SignOptions["expiresIn"]>,
    });
};

// Token verify karke payload return karta hai; invalid/expired token pe error throw hota hai
// Purane UUID wale tokens (id string) yahan reject ho jaate hain, user ko dobara login karna hoga
export const verifyToken = (token: string): JwtPayload => {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === "string" || !Number.isInteger(decoded.id) || typeof decoded.email !== "string") {
        throw new jwt.JsonWebTokenError("Invalid token payload");
    }
    return { id: decoded.id, email: decoded.email };
};
