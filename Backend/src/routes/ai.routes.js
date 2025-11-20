// src/routes/ai.routes.js
import { Router } from "express";
import { getAIChatResponseController, summarizeDocumentController } from "../controllers/ai.controller.js";
const router = Router();
router.route("/chat").post(getAIChatResponseController);
router.route("/summarize-document").post(summarizeDocumentController);
export default router;