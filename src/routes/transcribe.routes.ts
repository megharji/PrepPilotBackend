import { Router } from "express";
import { transcribeAnswerHandler } from "../controllers/transcribe.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { uploadAudio } from "../middlewares/audioUpload.middleware.js";

const router = Router();

// Voice answer -> text (Groq Whisper). Pehle token check, phir recording receive.
router.post("/interviews/:id/transcribe", authenticate, uploadAudio, transcribeAnswerHandler);

export default router;
