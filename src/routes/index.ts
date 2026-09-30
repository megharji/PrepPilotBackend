import { Router } from "express";
import authRoutes from "./auth.routes.js";
import interviewRoutes from "./interview.routes.js";
import resumeRoutes from "./resume.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

// Har route file apna poora path khud likhti hai (jaise "/resumes"), taaki file khol ke hi URL samajh aaye
router.use(authRoutes);
router.use(userRoutes);
router.use(resumeRoutes);
router.use(interviewRoutes);

export default router;
