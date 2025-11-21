// PASTE THIS ENTIRE FILE INTO Backend/src/routes/ai.routes.js

import { Router } from "express";
import { getAIChatResponseController, summarizeDocumentController } from "../controllers/ai.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import verifyJWT from "../middleware/authMiddleware.js";

const router = Router();

// Protect AI routes
router.use(verifyJWT);

// Chat & Parse Intent
router.route("/chat").post(getAIChatResponseController);

// Summarize Document (Supports File Upload)
router.route("/summarize").post(
    upload.single("document"), // Name of the field in FormData
    summarizeDocumentController
);

export default router;