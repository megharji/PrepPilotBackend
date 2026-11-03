import { createHash, randomBytes } from "node:crypto";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

// Do tab ek saath refresh karein to dono ke paas same purana token hota hai. Itne second tak
// purana (abhi-abhi rotate hua) token bhi maante hain, warna doosra tab logout ho jaata.
const REUSE_GRACE_SECONDS = 30;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

// Naya refresh token: random 48 bytes (JWT nahi, sirf DB me check hota hai). Asli token sirf cookie me jaata hai.
export const issueRefreshToken = async (userId: number): Promise<string> => {
    const token = randomBytes(48).toString("base64url");
    await pool.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + make_interval(days => $3))`,
        [userId, hash(token), env.REFRESH_TOKEN_DAYS]
    );
    return token;
};

interface TokenRow {
    id: number;
    user_id: number;
    expired: boolean;
    revoked: boolean;
    // rotate ho chuka hai to kitne second pehle
    rotated_ago: number | null;
}

const sessionExpired = () => new ApiError(401, "Session expired. Please log in again.");

// Purana refresh token do, naya lo (rotation). Kis user ka tha wo bhi wapas.
export const rotateRefreshToken = async (token: string): Promise<{ userId: number; refreshToken: string }> => {
    const result = await pool.query<TokenRow>(
        `SELECT id, user_id, expires_at < NOW() AS expired, revoked_at IS NOT NULL AS revoked,
                EXTRACT(EPOCH FROM (NOW() - rotated_at))::int AS rotated_ago
         FROM refresh_tokens WHERE token_hash = $1`,
        [hash(token)]
    );
    const row = result.rows[0];

    // Logout ho chuka, chori pakdi gayi, ya expire: bilkul nahi
    if (!row || row.expired || row.revoked) {
        throw sessionExpired();
    }

    if (row.rotated_ago !== null) {
        // Kaafi pehle rotate ho chuka token dobara aaya: kisi ne chura ke use kiya ho sakta hai.
        // Is user ke saare sessions band, asli user ko dobara login karna padega.
        if (row.rotated_ago > REUSE_GRACE_SECONDS) {
            await revokeAllForUser(row.user_id);
            throw sessionExpired();
        }
        // Grace me (doosra tab): naya token de do, kuch band mat karo
    } else {
        await pool.query("UPDATE refresh_tokens SET rotated_at = NOW() WHERE id = $1 AND rotated_at IS NULL", [row.id]);
    }

    return { userId: row.user_id, refreshToken: await issueRefreshToken(row.user_id) };
};

// Logout: sirf ye wala session band (doosre device ka login chalta rahe)
export const revokeRefreshToken = async (token: string): Promise<void> => {
    await pool.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL", [
        hash(token),
    ]);
};

const revokeAllForUser = async (userId: number): Promise<void> => {
    await pool.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL", [
        userId,
    ]);
};
