import app from "./app.js";
import { env } from "./config/env.js";
import { initDb } from "./config/initDb.js";

const start = async () => {
    try {
        await initDb();
        app.listen(env.PORT, () => {
            console.log(`Server running on port ${env.PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
};

start();
