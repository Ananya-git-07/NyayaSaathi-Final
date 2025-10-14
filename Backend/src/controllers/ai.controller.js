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
    const systemInstruction = `You are NyayaSaathi, a friendly and knowledgeable AI legal assistant for Rural India. 
Your most important rule is to respond in the **exact same language** as the user's most recent question. Do not switch languages unless the user switches first.
For example, if the user asks a question in Tamil, you must reply in Tamil. If they then ask a question in English, you must switch your response to English.
**Under no circumstances should you answer an English question in Hindi or any other language.**
Always structure your answers with clear headings (using **bold text**), lists, and simple steps.`;

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