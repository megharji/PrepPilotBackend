import { pool } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import type { User } from "../types/auth.types.js";

export const getUserById = async (id: number): Promise<User> => {
    const result = await pool.query<User>(
        `SELECT id, name, email, created_at AS "createdAt" FROM users WHERE id = $1`,
        [id]
    );
    const user = result.rows[0];

    // Token valid hai par user delete ho chuka ho
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return user;
};
