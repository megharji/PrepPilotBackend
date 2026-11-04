import pg from "pg";
import { env } from "./env.js";

// Local ho ya Neon, sirf DATABASE_URL badalta hai. Neon ki URL me "?sslmode=require" hota hai, pg usi se SSL lagata hai.
export const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    // Neon khaali padi connections khud band kar deta hai; hum bhi 30s baad chhod dete hain
    idleTimeoutMillis: 30_000,
    // Neon ka compute so gaya ho to jaagne me kuch second lagte hain
    connectionTimeoutMillis: 15_000,
});

// Khaali padi connection server ne kaat di (Neon pe normal hai): log karo, process crash mat hone do.
// Pool agli query pe nayi connection bana leta hai.
pool.on("error", (err) => {
    console.error("Idle DB connection closed:", err.message);
});
