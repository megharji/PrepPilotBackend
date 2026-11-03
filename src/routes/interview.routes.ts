import { Router } from "express";
import {
    createInterviewHandler,
    deleteInterviewHandler,
    getInterviewHandler,
    getInterviewsHandler,
    liveFollowUpHandler,
    prepareQuestionsHandler,
    submitInterviewHandler,
} from "../controllers/interview.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/interviews", authenticate, createInterviewHandler);
router.get("/interviews", authenticate, getInterviewsHandler);
router.get("/interviews/:id", authenticate, getInterviewHandler);
router.delete("/interviews/:id", authenticate, deleteInterviewHandler);
// AI (Groq): sawaal banana, aur jawab check karke score
router.post("/interviews/:id/questions", authenticate, prepareQuestionsHandler);
// User ke jawab pe follow-up (interview chalte waqt)
router.post("/interviews/:id/follow-up", authenticate, liveFollowUpHandler);
router.post("/interviews/:id/submit", authenticate, submitInterviewHandler);

export default router;
