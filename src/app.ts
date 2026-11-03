import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";

const app = express();

// credentials: true = browser refresh token cookie bhej sake; iske saath origin "*" nahi chalta
app.use(cors({ origin: env.CLIENT_ORIGINS, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
