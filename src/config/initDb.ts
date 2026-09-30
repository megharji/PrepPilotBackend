import { pool } from "./db.js";

// id: SERIAL = 1, 2, 3... apne aap badhta hai
const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        email       VARCHAR(255) NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
`;

// User delete hua to uske resumes bhi delete (ON DELETE CASCADE)
const createResumesTable = `
    CREATE TABLE IF NOT EXISTS resumes (
        id             SERIAL PRIMARY KEY,
        user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        original_name  VARCHAR(255) NOT NULL,
        file_path      VARCHAR(500) NOT NULL,
        mime_type      VARCHAR(100) NOT NULL,
        size_bytes     INTEGER NOT NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
`;

// Allowed values CHECK constraint se DB level pe bhi pakke (sirf API validation pe bharosa nahi)
// Resume delete hua to interview bacha rahe, bas resume_id NULL ho jaye
const createInterviewsTable = `
    CREATE TABLE IF NOT EXISTS interviews (
        id                SERIAL PRIMARY KEY,
        user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_role       VARCHAR(100) NOT NULL,
        experience_years  SMALLINT NOT NULL CHECK (experience_years BETWEEN 0 AND 50),
        job_description   TEXT,
        resume_id         INTEGER REFERENCES resumes(id) ON DELETE SET NULL,
        interview_type    VARCHAR(20) NOT NULL CHECK (interview_type IN ('TECHNICAL', 'BEHAVIORAL', 'HR', 'MIXED')),
        difficulty        VARCHAR(20) NOT NULL DEFAULT 'AUTO' CHECK (difficulty IN ('AUTO', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
        status            VARCHAR(20) NOT NULL DEFAULT 'SETUP' CHECK (status IN ('SETUP', 'IN_PROGRESS', 'COMPLETED')),
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
`;

// Server start hote hi tables bana deta hai (agar pehle se nahi hain)
export const initDb = async () => {
    await pool.query(createUsersTable);
    await pool.query(createResumesTable);
    await pool.query(createInterviewsTable);
    console.log("Database connected & tables ready");
};
