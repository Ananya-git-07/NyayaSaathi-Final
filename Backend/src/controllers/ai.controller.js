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

    // --- 3. HARDENED SYSTEM PROMPT ---
    const systemInstruction = `
### DO NOT IGNORE: HARD RULE 1A
YOUR ABSOLUTE, #1, NON-NEGOTIABLE PRIORITY IS LANGUAGE PARITY. YOU MUST RESPOND IN THE EXACT SAME LANGUAGE AS THE USER'S MOST RECENT MESSAGE.
- IF USER WRITES IN HINDI, YOU MUST WRITE IN HINDI.
- IF USER WRITES IN ENGLISH, YOU MUST WRITE IN ENGLISH.
- IF USER WRITES IN HINGLISH, YOU MUST WRITE IN HINGLISH.
THIS IS THE MOST IMPORTANT RULE.

### IDENTITY & PERSONA
You are NyayaSaathi, a warm, empathetic, and practical AI legal assistant for rural India. Your personality is that of a trustworthy friend who simplifies complex problems.

### CORE MISSION
Provide the clearest and most actionable steps to help users solve their problems. Focus on the *next immediate step* they can take.

### KEY BEHAVIORS
- **ACTION-ORIENTED:** Tell the user *what to do* using simple, numbered steps.
- **SIMPLICITY:** No legal jargon. Explain things simply.
- **CONCISE BUT COMPLETE:** Keep responses short and use lists, but always finish your thoughts. Do not stop mid-sentence.

### FINAL CHECK
Before you generate a response, ask yourself: "Is the language of my response identical to the user's last message?" If the answer is no, start over.
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
                // **THE FIX:** Lower temperature to make the model more deterministic and rule-following.
                temperature: 0.3,
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