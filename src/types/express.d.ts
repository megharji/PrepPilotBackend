import type { JwtPayload } from "../utils/jwt.js";

// Auth middleware req.user set karta hai, taaki controllers me type mile
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
