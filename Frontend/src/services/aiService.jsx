import apiClient from '../api/axiosConfig';

/**
 * The single source for all AI interactions in the NyayaSaathi application.
 * AI responses are dynamic based on user role and always NyayaSaathi-focused.
 */

const getGenerativeAIChatResponse = async (conversationHistory, newQuery, userRole = "citizen") => {
  try {
    // 🧭 Dynamic system prompt
    const systemPrompt = `
You are NyayaSaathi AI — a friendly, human-like legal support assistant for the NyayaSaathi platform.

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

    // Send request to backend
    const { data } = await apiClient.post('/ai/chat', {
      systemPrompt,
      conversationHistory,
      newQuery,
      userRole, // optional, for backend logic if supported
    });

    if (data.success && data.data.response) {
      return data.data.response;
    } else {
      throw new Error(data.message || "Received an invalid response from the AI.");
    }

  } catch (error) {
    console.error("AI Service Error:", error);
    const errorMessage =
      error.response?.data?.message ||
      "Sorry, I couldn't connect to the AI assistant right now. Please check the server connection.";
    throw new Error(errorMessage);
  }
};

// ----------------------------------------------
// Text extraction helper (unchanged)
// ----------------------------------------------
const parseFormDataFromText = (text) => {
  const lowerText = text.toLowerCase();
  const data = {};

  const keywords = {
    issueType: ['type is', 'category is', 'issue is', 'about'],
    description: ['description is', 'details are', 'problem is'],
    documentType: ['document type is', 'document is', 'file is'],
  };

  const extractValue = (targetKeywords) => {
    for (const keyword of targetKeywords) {
      if (lowerText.includes(keyword)) {
        return lowerText.split(keyword)[1].trim().split(/ and | with /)[0];
      }
    }
    return null;
  };

  const issueTypesEnum = [
    "Aadhaar Issue",
    "Pension Issue",
    "Land Dispute",
    "Court Summon",
    "Certificate Missing",
    "Fraud Case",
    "Other",
  ];

  const extractedIssueType = extractValue(keywords.issueType);
  if (extractedIssueType) {
    const matchedType = issueTypesEnum.find(
      (t) => t.toLowerCase() === extractedIssueType.toLowerCase().trim()
    );
    data.issueType = matchedType || "Other";
  }

  const extractedDocType = extractValue(keywords.documentType);
  if (extractedDocType) {
    data.documentType =
      extractedDocType.charAt(0).toUpperCase() + extractedDocType.slice(1);
  }

  const extractedDescription = extractValue(keywords.description);
  if (extractedDescription) {
    data.description =
      extractedDescription.charAt(0).toUpperCase() + extractedDescription.slice(1);
  }

  if (!extractedDescription && !extractedIssueType && !extractedDocType) {
    data.description = text.charAt(0).toUpperCase() + text.slice(1);
  }

  return data;
};

export const aiService = {
  getChatResponse: getGenerativeAIChatResponse,
  parseFormDataFromText,
};
