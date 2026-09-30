import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { generateToken } from "../utils/jwt.js";
import type { LoginInput, RegisterInput, User, UserWithPassword } from "../types/auth.types.js";

// Register ke saath hi token bhi, taaki user ko alag se login na karna pade
export const registerUser = async ({ name, email, password }: RegisterInput): Promise<{ user: User; token: string }> => {
    // Check email already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rowCount) {
        throw new ApiError(409, "Email already registered");
    }

    // Password hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // PostgreSQL me user save
    let user: User;
    try {
        const result = await pool.query<User>(
            `INSERT INTO users (name, email, password)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, created_at AS "createdAt"`,
            [name, email, hashedPassword]
        );
        user = result.rows[0]!;
    } catch (err: any) {
        // Same email ke do request ek saath aaye to UNIQUE constraint pakad leta hai
        if (err.code === "23505") {
            throw new ApiError(409, "Email already registered");
        }
        throw err;
    }

    const token = generateToken({ id: user.id, email: user.email });

    return { user, token };
};

export const loginUser = async ({ email, password }: LoginInput): Promise<{ user: User; token: string }> => {
    // Email se user dhundo
    const result = await pool.query<UserWithPassword>(
        `SELECT id, name, email, password, created_at AS "createdAt" FROM users WHERE email = $1`,
        [email]
    );
    const found = result.rows[0];

    // Password match karo
    // Email galat ho ya password, dono me same message, taaki koi pata na laga sake ki email registered hai
    if (!found || !(await bcrypt.compare(password, found.password))) {
        throw new ApiError(401, "Invalid email or password");
    }

    // Response me password nahi bhejna
    const { password: _password, ...user } = found;

    const token = generateToken({ id: user.id, email: user.email });

    return { user, token };
};
