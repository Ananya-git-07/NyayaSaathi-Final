// PASTE THIS ENTIRE FILE INTO src/services/aiService.jsx

import apiClient from '../api/axiosConfig';

/**
 * The single source for all AI interactions in the NyayaSaathi application.
 */

const getGenerativeAIChatResponse = async (conversationHistory, newQuery) => {
  try {
    const { data } = await apiClient.post('/ai/chat', {
      conversationHistory,
      newQuery,
      mode: 'chat' // Default mode
    });

    if (data.success && data.data.response) {
      return data.data.response;
    } else {
      throw new Error("Invalid response from AI.");
    }
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw error;
  }
};

/**
 * Sends natural language to the backend to extract structured intent and data.
 * @param {string} text - The user's spoken or typed input.
 * @returns {object} - Structured JSON { intent, data, missingInfo }
 */
const parseUserIntent = async (text) => {
  try {
    const { data } = await apiClient.post('/ai/chat', {
      newQuery: text,
      mode: 'parse'
    });

    if (data.success && data.data.parsed) {
      return data.data.parsed;
    } else {
      // Fallback if backend didn't return parsed object
      return JSON.parse(data.data.response);
    }
  } catch (error) {
    console.error("AI Parse Error:", error);
    // Fallback to basic regex if API fails
    return parseFormDataRegex(text);
  }
};

// --- Legacy Fallback (Regex) ---
const parseFormDataRegex = (text) => {
  const lowerText = text.toLowerCase();
  let intent = 'general_query';
  const data = {};

  if (lowerText.includes('issue') || lowerText.includes('complaint') || lowerText.includes('problem')) {
    intent = 'create_issue';
    if (lowerText.includes('aadhaar')) data.issueType = "Aadhaar Issue";
    else if (lowerText.includes('land')) data.issueType = "Land Dispute";
    else if (lowerText.includes('pension')) data.issueType = "Pension Issue";
    else data.issueType = "Other";
    data.description = text;
  } else if (lowerText.includes('document') || lowerText.includes('upload')) {
    intent = 'create_document';
    if (lowerText.includes('aadhaar')) data.documentType = "Aadhaar Card";
    else data.documentType = "Other";
  }

  return { intent, data, missingInfo: [] };
};

export const aiService = {
  getChatResponse: getGenerativeAIChatResponse,
  parseUserIntent,
  parseFormDataFromText: parseFormDataRegex // Keep for backward compatibility if needed
};