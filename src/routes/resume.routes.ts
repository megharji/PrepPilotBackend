import { Router } from "express";
import { uploadResumeHandler } from "../controllers/resume.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { uploadResume } from "../middlewares/upload.middleware.js";

const router = Router();

// Pehle token check, phir file receive; bina login ke file memory me load hi nahi hogi
router.post("/resumes",authenticate, uploadResume, uploadResumeHandler);

export default router;
