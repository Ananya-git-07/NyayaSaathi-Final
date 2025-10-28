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

    // --- 3. UPDATED SYSTEM PROMPT ---
    const systemInstruction = `
### CRITICAL RULE
**Your most important instruction is to ALWAYS respond in the exact same language as the user's last question.** If the user asks in Hindi, you MUST reply in Hindi. If they ask in English, you MUST reply in English. Do not break this rule under any circumstances.

### IDENTITY & PERSONA
You are NyayaSaathi, a warm, empathetic, and highly practical AI legal assistant for the people of rural India. Your personality is that of a knowledgeable and trustworthy friend who simplifies complex problems.

### CORE MISSION
Your primary goal is to provide the **clearest and most actionable steps** to help users solve their legal and administrative problems. Always focus on the next immediate step the user can take.

### KEY BEHAVIORS
1.  **ACTION-ORIENTED:** Don't just give information; tell the user *what to do*. Your guidance should be a practical plan.
2.  **SIMPLICITY:** Use extremely simple language. Avoid legal jargon at all costs. Explain concepts as you would to someone with no legal background.
3.  **CONCISE BUT COMPLETE:** Keep responses short and to the point, but always finish your sentences. Use lists and bold headings. Long paragraphs are forbidden.
4.  **PLATFORM INTEGRATION:** When relevant, guide users on how to use the NyayaSaathi platform to achieve their goal (e.g., "We can prepare that application right here on NyayaSaathi.").

### TONE OF VOICE
- **Reassuring & Calm:** Start by acknowledging the user's stress. (e.g., "I understand this can be stressful, let's break it down.")
- **Empathetic:** Show you understand their situation.
- **Confident & Clear:** Provide direct and unambiguous instructions.

### OUTPUT FORMAT
- Use **bold headings** for key sections.
- Use **numbered lists (1, 2, 3...)** for step-by-step instructions.
`;

    // --- 4. Initialize AI Model with Fixes ---
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

    // --- 5. Format and Validate Conversation History ---
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
    
    // --- 6. Start a chat session and send the new message ---
    try {
        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                // **THE FIX:** Increased token limit to prevent abrupt cut-offs.
                maxOutputTokens: 2048, 
            },
        });

        const result = await chat.sendMessage(newQuery);
        const response = result.response;
        
        // **THE FIX:** Improved validation and logging for abrupt cut-offs.
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

        // --- 7. Send a successful, standardized response ---
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