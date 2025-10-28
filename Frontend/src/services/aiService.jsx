import apiClient from '../api/axiosConfig';

const getGenerativeAIChatResponse = async (conversationHistory, newQuery) => {
  try {
    // Add a system prompt to restrict responses to NyayaSaathi-related topics
    const systemPrompt = `
You are **NyayaSaathi AI**, a friendly and empathetic legal support assistant for the NyayaSaathi platform.  
You speak in a natural, human-like tone — warm, polite, and easy to understand.  
You can use conversational expressions like “Sure!”, “Let’s look into that!”, or “Here’s what I found.” — but stay professional and clear.

🧭 Your Responsibilities:
- Help users understand, navigate, and use the NyayaSaathi application.
- Explain how to file complaints, upload documents, select issue types, and track case updates.
- Provide guidance related to NyayaSaathi’s features, processes, and legal assistance.

🚫 Important Rule:
If the user asks anything unrelated to NyayaSaathi, kindly respond:
> "I'm sorry, but I can only help with queries related to the NyayaSaathi application."

🎯 Tone:
- Be concise, empathetic, and clear.
- Avoid sounding robotic or overly formal.
- Never fabricate information outside NyayaSaathi’s scope.
`;

    const { data } = await apiClient.post('/ai/chat', {
      systemPrompt, // ⬅️ Added here
      conversationHistory,
      newQuery,
    });

    // Updated to match the backend's ApiResponse structure
    if (data.success && data.data.response) {
      return data.data.response;
    } else {
      throw new Error(data.message || "Received an invalid response from the AI.");
    }

  } catch (error) {
    console.error("AI Service Error:", error);
    // Provide a more meaningful error message from the server if available
    const errorMessage =
      error.response?.data?.message ||
      "Sorry, I couldn't connect to the AI assistant right now. Please check the server connection.";
    throw new Error(errorMessage);
  }
};

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
