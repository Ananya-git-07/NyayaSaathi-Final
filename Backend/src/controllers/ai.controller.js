// src/controllers/ai.controller.js

import { GoogleGenerativeAI } from "@google/generative-ai";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * @route POST /api/ai/chat
 * @description Handles chat requests by communicating with the Google Gemini API.
 * @access Protected (Requires a valid JWT)
 */
const getAIChatResponseController = asyncHandler(async (req, res) => {
    // --- 1. Validate incoming request ---
    const { conversationHistory, newQuery } = req.body;

    if (!newQuery || typeof newQuery !== 'string' || newQuery.trim() === '') {
        throw new ApiError(400, "Query content is required and cannot be empty.");
    }

    // --- 2. Securely get and validate the Gemini API Key ---
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        console.error("CRITICAL: GEMINI_API_KEY is not configured on the server.");
        throw new ApiError(500, "The AI service is not configured correctly on the server.");
    }

    // --- 3. Define a More Robust System Instruction ---

    // --- THIS IS THE CRITICAL FIX ---
    // This instruction is now more forceful and explicit about language mirroring.
    const systemInstruction = `You are NyayaSaathi AI — a friendly, human-like legal support assistant for the NyayaSaathi platform.

🎯 Core Role:
- You ONLY answer questions related to NyayaSaathi: case filing, issue types, document uploads, platform guidance, and legal support workflow.
- If the user asks about anything unrelated, reply:
  > "I'm sorry, but I can only help with queries related to the NyayaSaathi application."

🧑‍⚖️ Behavior by User Role:

1️⃣ Citizen:
- Respond like a helpful human friend.
- Keep answers short (2–4 sentences).
- Focus on guidance, reassurance, and clear next steps.
- Avoid complex legal jargon; use simple, supportive language.

2️⃣ Officer:
- Be formal yet conversational.
- Provide slightly more detail (up to 5–6 sentences).
- Focus on case handling, complaint verification, and workflow clarity.

3️⃣ Admin:
- Be concise and professional.
- Focus on platform management, issue tracking, and user support queries.

💬 Example for Citizen:
User: "I want to take a divorce."
AI: "I'm really sorry you're going through this. I can help guide you on how to get legal support through NyayaSaathi. Would you like me to show you how to file a case or connect you to a legal aid officer?"

Tone:
- Always warm, empathetic, and easy to understand.
- Never robotic, overly formal, or filled with unnecessary legal detail.
`;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction,
    });

    // --- 4. Format and VALIDATE conversation history ---
    let formattedHistory = (conversationHistory || []).map(message => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
    }));
    
    const firstUserIndex = formattedHistory.findIndex(msg => msg.role === 'user');

    if (firstUserIndex > -1) {
        formattedHistory = formattedHistory.slice(firstUserIndex);
    } else {
        formattedHistory = [];
    }
    
    // --- 5. Start a chat session and send the new message ---
    try {
        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(newQuery);
        const response = result.response;
        const aiResponse = response.text();

        if (!aiResponse) {
            throw new ApiError(500, "Received an empty response from the AI model.");
        }

        // --- 6. Send a successful, standardized response ---
        return res.status(200).json(
            new ApiResponse(
                200,
                { response: aiResponse },
                "AI chat response generated successfully."
            )
        );

    } catch (error) {
        console.error("Error communicating with Gemini API:", error);
        throw new ApiError(500, `An error occurred with the AI service: ${error.message}`);
    }
});

export { getAIChatResponseController };