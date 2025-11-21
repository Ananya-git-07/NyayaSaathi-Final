// PASTE THIS ENTIRE FILE INTO Backend/src/controllers/ai.controller.js

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import fs from "fs"; // Required for file reading

// --- CONFIGURATION ---
const getGeminiModel = (systemInstruction, responseMimeType = "text/plain") => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        throw new ApiError(500, "Gemini API Key is missing.");
    }
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    return genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction,
        generationConfig: { responseMimeType }
    });
};

/**
 * @route POST /api/ai/chat
 * @description Handles chat AND intent parsing
 */
export const getAIChatResponseController = asyncHandler(async (req, res) => {
    const { conversationHistory, newQuery, mode } = req.body;

    if (!newQuery || typeof newQuery !== 'string' || newQuery.trim() === '') {
        throw new ApiError(400, "Query content is required.");
    }

    // ... (Keep your existing System Prompts from the previous step here) ...
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
Output valid JSON only.
Possible Intents: "create_issue", "create_document", "register_user", "general_query".
Schema: { "intent": string, "data": object, "missingInfo": string[] }
`;

    const isParseMode = mode === 'parse';
    const model = getGeminiModel(
        isParseMode ? PARSE_SYSTEM_INSTRUCTION : CHAT_SYSTEM_INSTRUCTION,
        isParseMode ? "application/json" : "text/plain"
    );

    let formattedHistory = [];
    if (!isParseMode && conversationHistory) {
        formattedHistory = conversationHistory.map(message => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }],
        }));
    }

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(newQuery);
    const aiResponse = result.response.text();

    return res.status(200).json(
        new ApiResponse(200, { 
            response: aiResponse, 
            parsed: isParseMode ? JSON.parse(aiResponse) : null 
        }, "AI response generated.")
    );
});

/**
 * @route POST /api/ai/summarize
 * @description Summarizes legal documents (Text or File) into simple terms.
 */
export const summarizeDocumentController = asyncHandler(async (req, res) => {
    const { text, language } = req.body;
    const file = req.file;

    if (!text && !file) {
        throw new ApiError(400, "Please provide text or upload a document to summarize.");
    }

    const targetLanguage = language === 'hi' ? 'Hindi' : 'English';

    const SUMMARIZE_SYSTEM_PROMPT = `
### ROLE: LEGAL DOCUMENT SIMPLIFIER
You are an expert legal analyst for rural India. Your job is to read complex legal documents and explain them to a layperson.

### OUTPUT FORMAT: JSON
{
  "summary": "A 3-4 sentence simple explanation of what this document is.",
  "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "recommendation": "One actionable piece of advice (e.g., 'Consult a lawyer', 'Sign only if...')",
  "documentType": "Type of document (e.g., Affidavit, Court Summon)"
}

### RULES:
1. **Language:** The output MUST be in **${targetLanguage}**.
2. **Simplicity:** Use simple words. Avoid Latin terms or complex legalese.
3. **Accuracy:** Do not hallucinate facts not present in the document.
`;

    const model = getGeminiModel(SUMMARIZE_SYSTEM_PROMPT, "application/json");

    let promptParts = [];
    
    // Handle Text Input
    if (text) {
        promptParts.push(text);
    }

    // Handle File Input (Multimodal)
    if (file) {
        const fileData = fs.readFileSync(file.path);
        const imagePart = {
            inlineData: {
                data: fileData.toString("base64"),
                mimeType: file.mimetype,
            },
        };
        promptParts.push(imagePart);
    }

    promptParts.push(`Summarize this content in ${targetLanguage}.`);

    try {
        const result = await model.generateContent(promptParts);
        const response = result.response;
        const jsonResponse = JSON.parse(response.text());

        // Cleanup temp file
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        return res.status(200).json(
            new ApiResponse(200, jsonResponse, "Document summarized successfully.")
        );

    } catch (error) {
        // Cleanup temp file on error
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        console.error("Summarization Error:", error);
        throw new ApiError(500, "Failed to summarize document. Ensure the file is readable.");
    }
});