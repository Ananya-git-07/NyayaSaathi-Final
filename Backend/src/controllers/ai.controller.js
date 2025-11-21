// PASTE THIS ENTIRE FILE INTO Backend/src/controllers/ai.controller.js

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * @route POST /api/ai/chat
 * @description Handles chat AND intent parsing by communicating with the Google Gemini API.
 * @access Protected (Requires a valid JWT)
 */
const getAIChatResponseController = asyncHandler(async (req, res) => {
    // --- 1. Validate incoming request ---
    const { conversationHistory, newQuery, mode } = req.body;

    if (!newQuery || typeof newQuery !== 'string' || newQuery.trim() === '') {
        throw new ApiError(400, "Query content is required and cannot be empty.");
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        throw new ApiError(500, "The AI service is not configured correctly on the server.");
    }

    // --- 2. DEFINE SYSTEM PROMPTS ---
    
    const CHAT_SYSTEM_INSTRUCTION = `
### YOUR #1 PRIORITY: LANGUAGE PARITY
You MUST respond in the exact same language and script as the user's most recent message.
- Hindi -> Hindi
- English -> English
- Hinglish -> Hinglish

### Persona
You are NyayaSaathi, an empathetic and practical AI legal assistant for rural India.
- **Action-Oriented:** Tell the user *what to do* next.
- **Simplicity:** No legal jargon. Explain like a friend.
- **Be Concise:** Short, numbered lists are best.
`;

    const PARSE_SYSTEM_INSTRUCTION = `
### ROLE: INTENT PARSER
You are a backend data processor. Your job is to analyze the user's natural language input (in Hindi, English, or Hinglish) and extract structured data for a legal app.

### OUTPUT FORMAT: JSON ONLY
You must output valid JSON. Do not include markdown formatting like \`\`\`json.

### POSSIBLE INTENTS:
1. "create_issue" (Keywords: issue, problem, shikayat, dispute, fraud, etc.)
2. "create_document" (Keywords: upload, document, file, kagaz, certificate)
3. "register_user" (Keywords: sign up, register, account)
4. "general_query" (If it's just a question like "How are you?" or "What is Aadhaar?")

### SCHEMA:
{
  "intent": "create_issue" | "create_document" | "register_user" | "general_query",
  "data": {
    "issueType": "Land Dispute" | "Aadhaar Issue" | "Pension Issue" | "Fraud Case" | "Court Summon" | "Other",
    "description": "Extracted summary of the problem (translated to English)",
    "documentType": "Aadhaar Card" | "PAN Card" | "Land Deed" | "Affidavit" | "Other",
    "fullName": "Extracted Name",
    "location": "Extracted Location"
  },
  "missingInfo": ["List of fields that seem missing based on the intent"]
}

### EXAMPLES:
Input: "Mera naam Rahul hai aur mere padosi ne meri zameen hadap li hai Rampur mein."
Output: { "intent": "create_issue", "data": { "issueType": "Land Dispute", "description": "Neighbor encroached on land in Rampur", "fullName": "Rahul", "location": "Rampur" }, "missingInfo": [] }

Input: "Mujhe apna Aadhaar upload karna hai."
Output: { "intent": "create_document", "data": { "documentType": "Aadhaar Card" }, "missingInfo": ["issueId"] }
`;

    // --- 3. Initialize AI Model ---
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const isParseMode = mode === 'parse';

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: isParseMode ? PARSE_SYSTEM_INSTRUCTION : CHAT_SYSTEM_INSTRUCTION,
        // Force JSON response for parse mode
        generationConfig: { responseMimeType: isParseMode ? "application/json" : "text/plain" } 
    });

    // --- 4. Format History (Only for Chat Mode) ---
    let formattedHistory = [];
    if (!isParseMode && conversationHistory) {
        formattedHistory = conversationHistory.map(message => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }],
        }));
    }

    try {
        const chat = model.startChat({
            history: formattedHistory,
        });

        const result = await chat.sendMessage(newQuery);
        const response = result.response;
        const aiResponse = response.text();

        // --- 5. Return Response ---
        return res.status(200).json(
            new ApiResponse(
                200,
                { 
                    response: aiResponse,
                    // If parsing, try to parse JSON on backend to ensure validity before sending
                    parsed: isParseMode ? JSON.parse(aiResponse) : null 
                },
                "AI response generated successfully."
            )
        );

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new ApiError(500, "Failed to process AI request.");
    }
});

export { getAIChatResponseController };