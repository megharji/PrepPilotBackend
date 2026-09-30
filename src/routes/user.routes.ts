import { Router } from "express";
import { getProfile } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/users/profile",authenticate, getProfile);

export default router;
