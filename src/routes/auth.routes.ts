import { Router } from "express";
import { login, logout, refresh, register } from "../controllers/auth.controller.js";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
// Access token expire hone pe naya (refresh token cookie se); token header nahi chahiye
router.post("/auth/refresh", refresh);
router.post("/auth/logout", logout);

export default router;
