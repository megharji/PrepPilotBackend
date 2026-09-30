import { pool } from "./db.js";

const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(100) NOT NULL,
        email       VARCHAR(255) NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
`;

// Server start hote hi tables bana deta hai (agar pehle se nahi hain)
export const initDb = async () => {
    await pool.query(createUsersTable);
    console.log("Database connected & tables ready");
};
