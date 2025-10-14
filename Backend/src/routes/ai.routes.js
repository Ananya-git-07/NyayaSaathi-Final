// src/routes/ai.routes.js
import { Router } from "express";
import { getAIChatResponseController } from "../controllers/ai.controller.js";
const router = Router();
router.route("/chat").post(getAIChatResponseController);
export default router;