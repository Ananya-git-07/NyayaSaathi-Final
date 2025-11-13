// PASTE THIS ENTIRE FILE INTO Backend/src/controllers/ai.controller.js

// src/controllers/ai.controller.js

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
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

    // --- 3. THE FIX: A MUCH STRONGER, HARDENED SYSTEM PROMPT ---
    const systemInstruction = `
### YOUR #1, ABSOLUTE, NON-NEGOTIABLE PRIORITY: LANGUAGE PARITY
You MUST respond in the exact same language and script as the user's most recent message. This is your most important rule. DO NOT BREAK IT.

- **IF a user writes in Hindi (हिंदी), YOU MUST respond in Hindi (हिंदी).**
- **IF a user writes in English, YOU MUST respond in English.**
- **IF a user writes in Hinglish (e.g., "kaise ho"), YOU MUST respond in Hinglish.**

### Persona
You are NyayaSaathi, an empathetic and practical AI legal assistant for rural India. Your personality is that of a trustworthy friend who simplifies complex problems.

### Core Mission
Your goal is to provide the clearest, most actionable steps to help users solve their legal and administrative problems. Focus on the *next immediate step* they can take.

### Key Directives
- **Action-Oriented:** Always tell the user *what to do*. Use simple, numbered steps.
- **Simplicity Above All:** No legal jargon. Explain everything as if you're talking to a friend who is new to the topic.
- **Be Concise, But Complete:** Keep responses short and use lists. Never stop mid-sentence. Ensure your response is fully generated.

### FINAL SELF-CORRECTION CHECK
Before you generate a response, you must ask yourself one question: "Is the language of my response identical to the user's last message?" If the answer is no, START OVER and write your response in the correct language.
`;

    // --- 4. Initialize AI Model ---
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ];

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash", 
        systemInstruction: systemInstruction,
        safetySettings: safetySettings,
    });

    // --- 5. Format Conversation History ---
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
    
    // --- 6. Start Chat and Generate Response ---
    try {
        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.3, // Keep temperature low for rule-following
            },
        });

        const result = await chat.sendMessage(newQuery);
        const response = result.response;
        
        if (response.promptFeedback?.blockReason) {
            console.error("Gemini Response Blocked:", response.promptFeedback);
            throw new ApiError(500, "The response was blocked by the AI's safety filters.");
        }

        const aiResponse = response.text();

        if (!aiResponse) {
             const finishReason = response.candidates?.[0]?.finishReason;
             console.error(`Empty response from Gemini. Finish Reason: ${finishReason || "Unknown"}`);
             if (finishReason === "MAX_TOKENS") {
                console.warn("WARNING: AI response was cut off because it reached the maximum token limit.");
             }
             throw new ApiError(500, "Received an empty response from the AI model.");
        }

        // --- 7. Send Successful Response ---
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