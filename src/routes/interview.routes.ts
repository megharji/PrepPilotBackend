import { Router } from "express";
import { createInterviewHandler } from "../controllers/interview.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/interviews",authenticate, createInterviewHandler);

export default router;
