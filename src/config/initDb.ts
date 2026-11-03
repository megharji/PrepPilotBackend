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

// Refresh tokens: asli token kabhi save nahi hota, sirf uska SHA-256 hash (DB leak ho to bhi token kaam ka nahi).
// rotated_at: refresh pe naya token ban gaya (purana thodi der grace me chalta hai).
// revoked_at: logout ya chori pakdi gayi, ab bilkul nahi chalega.
const createRefreshTokensTable = `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash  CHAR(64) NOT NULL UNIQUE,
        expires_at  TIMESTAMPTZ NOT NULL,
        rotated_at  TIMESTAMPTZ,
        revoked_at  TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
    ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS rotated_at TIMESTAMPTZ;
`;

// Expire ho chuke tokens ka kachra hatao (server start pe)
const cleanupRefreshTokens = `DELETE FROM refresh_tokens WHERE expires_at < NOW()`;

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
        tech_stack        VARCHAR(50),
        job_description   TEXT,
        resume_id         INTEGER REFERENCES resumes(id) ON DELETE SET NULL,
        interview_type    VARCHAR(20) NOT NULL
                          CONSTRAINT interviews_interview_type_check
                          CHECK (interview_type IN ('TECHNICAL', 'BEHAVIORAL', 'HR', 'MIXED', 'CODING')),
        difficulty        VARCHAR(20) NOT NULL DEFAULT 'AUTO' CHECK (difficulty IN ('AUTO', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
        status            VARCHAR(20) NOT NULL DEFAULT 'SETUP' CHECK (status IN ('SETUP', 'IN_PROGRESS', 'COMPLETED')),
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
`;

// Pehle se bani table ko naye schema pe laana (baar baar chalana safe hai, data nahi chhedta):
// tech_stack column, AI ke sawaal (questions) aur score (report), kab khatam hua aur kitna time laga,
// CODING type allow karna
const migrateInterviewTypes = `
    ALTER TABLE interviews ADD COLUMN IF NOT EXISTS tech_stack VARCHAR(50);
    ALTER TABLE interviews ADD COLUMN IF NOT EXISTS questions JSONB;
    ALTER TABLE interviews ADD COLUMN IF NOT EXISTS report JSONB;
    ALTER TABLE interviews ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
    ALTER TABLE interviews ADD COLUMN IF NOT EXISTS duration_sec INTEGER;
    ALTER TABLE interviews DROP CONSTRAINT IF EXISTS interviews_interview_type_check;
    ALTER TABLE interviews ADD CONSTRAINT interviews_interview_type_check
        CHECK (interview_type IN ('TECHNICAL', 'BEHAVIORAL', 'HR', 'MIXED', 'CODING'));
`;

// Server start hote hi tables bana deta hai (agar pehle se nahi hain)
export const initDb = async () => {
    await pool.query(createUsersTable);
    await pool.query(createRefreshTokensTable);
    await pool.query(cleanupRefreshTokens);
    await pool.query(createResumesTable);
    await pool.query(createInterviewsTable);
    await pool.query(migrateInterviewTypes);
    console.log("Database connected & tables ready");
};
