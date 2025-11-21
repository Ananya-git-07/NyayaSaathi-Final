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
### YOUR #1, ABSOLUTE, NON-NEGOTIABLE PRIORITY: LANGUAGE MATCHING
You MUST respond in the EXACT SAME LANGUAGE as the user's question. This is your PRIMARY rule.

**LANGUAGE RULES (HIGHEST PRIORITY):**
- If user writes in Hindi (हिंदी देवनागरी script), respond ONLY in Hindi देवनागरी script
- If user writes in English, respond ONLY in English
- If user writes in Hinglish (Roman Hindi like "kaise ho"), respond in Hinglish
- NEVER translate the user's question language to another language
- The language of your response MUST EXACTLY MATCH the user's last message

### Persona
You are NyayaSaathi (न्यायसाथी), a trusted AI legal assistant for rural India. You are like a helpful friend who explains things simply.

### Core Mission
Provide clear, actionable legal guidance in simple language. Focus on immediate next steps the user can take.

### Response Guidelines
1. **Match Language:** First check what language the user used, then respond in THAT language
2. **Be Simple:** No legal jargon - explain like talking to a friend
3. **Be Actionable:** Give numbered steps the user can follow
4. **Be Complete:** Never stop mid-sentence
5. **Be Concise:** Keep answers focused and brief

### Example Language Matching:
- User: "What are the steps to resolve a land dispute?" → Response in English
- User: "जमीन के विवाद को हल करने के क्या कदम हैं?" → Response in Hindi only
- User: "Land dispute kaise solve kare?" → Response in Hinglish

### CRITICAL CHECK BEFORE RESPONDING:
Ask yourself: "What language/script did the user use in their last message?" 
Then respond in THAT EXACT language/script. NO EXCEPTIONS.
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
    
    // Detect if the query contains Hindi/Devanagari characters
    const containsHindi = /[\u0900-\u097F]/.test(newQuery);
    const languageHint = containsHindi 
        ? "\n\n[CRITICAL INSTRUCTION: The user's question is written in Hindi Devanagari script. You MUST respond ONLY in Hindi Devanagari script (हिंदी). DO NOT use English or Roman script.]" 
        : "\n\n[CRITICAL INSTRUCTION: The user's question is written in English. You MUST respond ONLY in English. DO NOT use Hindi, Devanagari script, or Hinglish. Use proper English only.]";
    
    // --- 6. Start Chat and Generate Response ---
    try {
        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.3, // Keep temperature low for rule-following
            },
        });

        const result = await chat.sendMessage(newQuery + languageHint);
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

/**
 * @route POST /api/ai/summarize-document
 * @description Summarizes a legal document using AI
 * @access Protected (Requires a valid JWT)
 */
const summarizeDocumentController = asyncHandler(async (req, res) => {
    const { documentText, documentUrl, documentType, publicId, resourceType, format } = req.body;
    let { imageBase64, imageMimeType } = req.body;

    let textToSummarize = documentText;
    let hasImage = false;

    // If publicId is provided, use Cloudinary Admin API to fetch the resource with authentication
    if (!textToSummarize && publicId) {
        try {
            const { v2: cloudinary } = (await import('cloudinary'));
            
            // Configure cloudinary
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            });
            
            console.log(`Fetching document from Cloudinary using publicId: ${publicId}, resourceType: ${resourceType}, format: ${format}`);
            
            // Determine the correct resource type
            let actualResourceType = resourceType || 'auto';
            
            // Extract format from publicId if format is not provided
            let detectedFormat = (format || '').toLowerCase();
            if (!detectedFormat && publicId) {
                const fileExtMatch = publicId.match(/\.([a-z0-9]+)$/i);
                if (fileExtMatch) {
                    detectedFormat = fileExtMatch[1].toLowerCase();
                }
            }
            
            // If format suggests it's an image, use 'image' resource type
            if (detectedFormat && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'jfif'].includes(detectedFormat)) {
                actualResourceType = 'image';
            }
            // If format is PDF, use 'raw' resource type
            else if (detectedFormat === 'pdf') {
                actualResourceType = 'raw';
            }
            // If resourceType was provided, use it
            else if (resourceType) {
                actualResourceType = resourceType;
            }
            
            console.log(`Using resource type: ${actualResourceType} for format: ${detectedFormat}`);
            
            // Get resource details
            const resource = await cloudinary.api.resource(publicId, {
                resource_type: actualResourceType,
                type: 'upload'
            });
            
            const authenticatedUrl = resource.secure_url || resource.url;
            // Use detected format or resource format
            const finalFormat = detectedFormat || (resource.format || '').toLowerCase();
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'jfif'].includes(finalFormat);
            
            console.log(`Final format: ${finalFormat}, isImage: ${isImage}`);
            
            if (isImage) {
                // Fetch the image and convert to base64
                const axios = (await import('axios')).default;
                const response = await axios.get(authenticatedUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                });
                
                const base64 = Buffer.from(response.data).toString('base64');
                hasImage = true;
                imageBase64 = base64;
                // Normalize MIME type
                imageMimeType = `image/${finalFormat === 'jpg' || finalFormat === 'jfif' ? 'jpeg' : finalFormat}`;
                
                console.log(`Successfully fetched image document (${imageMimeType}) from Cloudinary`);
            } else if (finalFormat === 'pdf') {
                throw new ApiError(400, "PDF document analysis is not yet supported. Please convert PDF pages to images (PNG/JPEG) for analysis.");
            } else {
                throw new ApiError(400, `Unsupported document format: ${finalFormat || 'unknown'}. Only image formats (PNG, JPEG, GIF) are currently supported.`);
            }
            
        } catch (error) {
            console.error("Cloudinary API error:", error);
            
            // If it's already an ApiError, re-throw it
            if (error.statusCode) {
                throw error;
            }
            
            throw new ApiError(400, `Failed to fetch document from cloud storage: ${error.message}`);
        }
    }
    // If documentUrl is provided, fetch the document from the URL (e.g., Cloudinary)
    if (!textToSummarize && documentUrl) {
        try {
            // First check the URL extension to determine file type (more reliable than content-type header)
            const urlLower = documentUrl.toLowerCase();
            const isImageUrl = urlLower.match(/\.(jpg|jpeg|png|gif|webp|bmp|jfif)$/i);
            const isPdfUrl = urlLower.match(/\.pdf$/i);
            
            const fetchResponse = await fetch(documentUrl);
            
            // Even if fetch fails (like with Cloudinary 401), we can still determine type from URL
            const contentType = fetchResponse.headers.get('content-type') || '';
            
            // Check if it's an image file (prioritize URL extension over content-type)
            if (isImageUrl || (contentType.startsWith('image/') && !isPdfUrl)) {
                // For images, we need to fetch them successfully
                if (!fetchResponse.ok) {
                    throw new ApiError(400, `Failed to fetch image from URL: ${fetchResponse.statusText}. The document storage may have access restrictions.`);
                }
                
                const blob = await fetchResponse.blob();
                // Convert image to base64 for Gemini vision
                const arrayBuffer = await blob.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                
                // Set image data for vision analysis
                hasImage = true;
                imageBase64 = base64;
                // Determine mime type from URL extension if content-type is wrong
                if (isImageUrl) {
                    const ext = isImageUrl[1].toLowerCase();
                    imageMimeType = `image/${ext === 'jpg' || ext === 'jfif' ? 'jpeg' : ext}`;
                } else {
                    imageMimeType = contentType || 'image/jpeg';
                }
                
                console.log(`Document is an image (${imageMimeType}), using vision analysis`);
            } else if (isPdfUrl || contentType.includes('pdf')) {
                // For PDFs, try to fetch and convert to text
                // This requires additional libraries like pdf-parse
                throw new ApiError(400, "PDF document analysis from URL requires the document to be converted to images or text first. Please upload individual pages as images for best results.");
            } else {
                // Assume it's text-based
                if (!fetchResponse.ok) {
                    throw new ApiError(400, `Failed to fetch document from URL: ${fetchResponse.statusText}`);
                }
                const blob = await fetchResponse.blob();
                textToSummarize = await blob.text();
            }
        } catch (error) {
            console.error("Error fetching document from URL:", error);
            // If it's already an ApiError, re-throw it
            if (error.statusCode) {
                throw error;
            }
            throw new ApiError(400, `Error fetching document from URL: ${error.message}`);
        }
    }

    // Check if we have image data
    if (imageBase64 && imageMimeType) {
        hasImage = true;
    }

    // Validate that we have either text or image
    if (!hasImage && (!textToSummarize || typeof textToSummarize !== 'string' || textToSummarize.trim() === '')) {
        throw new ApiError(400, "Document text, image, or URL is required.");
    }

    // Limit text length to avoid token limits
    if (textToSummarize && textToSummarize.length > 10000) {
        textToSummarize = textToSummarize.substring(0, 10000);
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        console.error("CRITICAL: GEMINI_API_KEY is not configured on the server.");
        throw new ApiError(500, "The AI service is not configured correctly on the server.");
    }

    const systemInstruction = `
You are a legal document analyzer for NyayaSaathi, serving rural India.

Your task is to analyze the SPECIFIC document content provided and extract ACTUAL information from it.

**CRITICAL RULES:**
1. DO NOT give generic explanations about what type of documents are
2. ANALYZE THE ACTUAL CONTENT - extract names, dates, amounts, places, and specific details
3. If it's a certificate, tell me WHOSE certificate it is, WHAT it certifies, WHO issued it, and WHEN
4. If it's a legal notice, tell me WHO sent it, WHO received it, WHAT is the issue, and WHAT action is demanded
5. Extract ALL specific information: names of people, organizations, dates, amounts, locations
6. Use simple language but be SPECIFIC about the actual document content
7. If the document is too vague or you cannot extract specific details, say so clearly

**Output Format (JSON):**
{
  "documentType": "specific type like Birth Certificate, Sale Deed, Court Summons, etc.",
  "summary": "2-3 sentences about THIS SPECIFIC document - WHO, WHAT, WHEN, WHERE",
  "keyPoints": [
    "Specific detail 1 from the document (names, dates, amounts)",
    "Specific detail 2 from the document",
    "Specific detail 3 from the document"
  ],
  "recommendations": [
    "Specific action based on THIS document's content",
    "action 2",
    "action 3"
  ],
  "urgency": "low/medium/high based on document content",
  "nextSteps": "Specific next step based on THIS document"
}
`;

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",  // Using flash model for higher free tier limits
            systemInstruction: systemInstruction,
        });

        let prompt;
        let contentParts = [];

        if (hasImage) {
            // For image analysis
            prompt = `Analyze this document image and extract SPECIFIC information from it:

DO NOT give generic explanations. Extract ACTUAL details visible in the image:
- If there are names, list them
- If there are dates, mention them
- If there are amounts/numbers, include them
- If there are locations, state them
- Read ALL text visible in the image
- Tell me what THIS specific document is about, not what this type of document generally means

Provide your analysis in the JSON format specified in the system instructions.`;

            contentParts = [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: imageMimeType,
                        data: imageBase64
                    }
                }
            ];
            
            // Add text context if provided
            if (textToSummarize && textToSummarize.trim()) {
                contentParts.push({ text: `\n\nAdditional context: ${textToSummarize}` });
            }
        } else {
            // For text-only analysis
            prompt = `Read this document carefully and extract SPECIFIC information from it:

${textToSummarize}

DO NOT give generic explanations. Extract ACTUAL details from the text above:
- If there are names, list them
- If there are dates, mention them
- If there are amounts/numbers, include them
- If there are locations, state them
- Tell me what THIS specific document is about, not what this type of document generally means

Provide your analysis in the JSON format specified in the system instructions.`;
            
            contentParts = [{ text: prompt }];
        }

        const result = await model.generateContent(contentParts);
        const response = result.response;
        
        if (response.promptFeedback?.blockReason) {
            console.error("Gemini Response Blocked:", response.promptFeedback);
            throw new ApiError(500, "The response was blocked by the AI's safety filters.");
        }

        let aiResponse = response.text();
        
        // Extract JSON from markdown code blocks if present
        const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            aiResponse = jsonMatch[1];
        }

        // Parse the JSON response
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(aiResponse);
        } catch (parseError) {
            console.error("Failed to parse AI response as JSON:", aiResponse);
            // Fallback to text response
            parsedResponse = {
                documentType: documentType || "Legal Document",
                summary: aiResponse,
                keyPoints: ["Analysis completed - please review the summary above"],
                recommendations: ["Consult with a legal professional for detailed advice"],
                urgency: "medium",
                nextSteps: "Review the document carefully and seek legal consultation if needed"
            };
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                parsedResponse,
                "Document summarized successfully."
            )
        );

    } catch (error) {
        console.error("Error summarizing document:", error);
        throw new ApiError(500, `An error occurred while summarizing the document: ${error.message}`);
    }
});

export { getAIChatResponseController, summarizeDocumentController };