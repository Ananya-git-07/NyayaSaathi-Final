// This file acts as a local, rule-based AI expert system. It's fast, reliable, and requires no API.

const knowledgeBase = [
  // --- AADHAAR TOPICS ---
  {
    keywords: ["aadhaar", "aadhar", "update", "correct", "change", "address", "name", "dob"],
    title: "How to Update Your Aadhaar Card",
    content: `You can update your Aadhaar details both online and offline. Here’s a simple guide:

**1. Online Update (for Address):**
   - Visit the official UIDAI website: myaadhaar.uidai.gov.in
   - Log in using your Aadhaar number and the OTP sent to your registered mobile.
   - Select "Update Aadhaar Online".
   - Choose the information you want to update (e.g., Address).
   - Upload a clear, scanned copy of your proof document (like a recent utility bill, bank passbook, or rent agreement).
   - Pay the fee of ₹50 online.
   - You will get an Update Request Number (URN) to track the status.

**2. Offline Update (for Name, DOB, Mobile Number, etc.):**
   - Find your nearest Aadhaar Seva Kendra (ASK) or Enrollment Center.
   - Fill out the Aadhaar Correction Form.
   - Submit the form along with original copies of your supporting documents.
   - Your biometrics (fingerprints and photo) will be taken.
   - Pay the required fee (₹50 for demographic, ₹100 for biometric updates).
   - You will receive an acknowledgment slip with the URN.`,
    followUp: ["What documents are needed for an address change?", "How can I find my nearest Aadhaar center?"]
  },
  {
    keywords: ["aadhaar", "aadhar", "lost", "forgot", "duplicate"],
    title: "What to Do If You Lost Your Aadhaar Card",
    content: `Don't worry if you've lost your card. Your Aadhaar number is what's important. Here’s how to get it back:

**1. Download a Digital e-Aadhaar (Fastest Method):**
   - Go to the UIDAI website.
   - Click on "Download Aadhaar".
   - Enter your 12-digit Aadhaar number or Enrollment ID.
   - You will receive an OTP on your registered mobile number.
   - Enter the OTP to download a password-protected PDF.
   - The password is the first 4 letters of your name (in capitals) + your year of birth (YYYY). Example: For name RAMESH born in 1990, the password is "RAME1990".
   - This e-Aadhaar is as valid as the physical card everywhere.

**2. Order a new PVC Card:**
   - On the UIDAI website, you can order a durable PVC card for ₹50. It will be sent to your registered address by post.`,
    followUp: ["My mobile number is not linked to Aadhaar, what should I do?", "Is e-Aadhaar valid everywhere?"]
  },
  // --- LAND TOPICS ---
  {
    keywords: ["land", "property", "zameen", "dispute", "conflict", "issue"],
    title: "Resolving Land Disputes",
    content: `Land disputes are common and can be resolved through several channels.

**1. Revenue Courts (Tehsildar/Collector's Office):**
   - **Best for:** Issues with boundaries, land records correction, mutation, and tenancy.
   - **Process:** File an application with the Tehsildar or Sub-Divisional Magistrate (SDM). These courts are faster for record-related issues.

**2. Civil Courts:**
   - **Best for:** Serious disputes over ownership, title deeds, and property inheritance.
   - **Process:** This involves filing a formal civil suit through a lawyer. It can be a longer process but provides a definitive judgment.

**3. Lok Adalat (People's Court):**
   - **Best for:** Reaching a compromise or settlement with the other party.
   - **Process:** These are held periodically to settle cases quickly and amicably. The decision is binding on both parties.

**Key Documents You Will Need:**
- Sale Deed (Registry)
- Record of Rights (Khatauni/Jamabandi)
- Survey Map
- Property Tax Receipts`,
    followUp: ["What is land mutation?", "What is a Sale Deed?"]
  },
  {
    keywords: ["mutation", "dakhil kharij", "property transfer"],
    title: "Understanding Land Mutation (Dakhil Kharij)",
    content: `Mutation is the process of changing the title ownership of a property in the land revenue records of the local municipal body. It is crucial after you buy a property.

**Why is it important?**
- It establishes you as the new legal owner in government records.
- It is required for paying property tax accurately.
- It is essential if you plan to sell the property in the future.

**How to Apply:**
1. Visit the Tehsil or local municipal office.
2. Submit an application form for mutation.
3. Attach required documents: Copy of the sale deed, latest property tax receipt, and an indemnity bond.
4. The department will verify the documents and may conduct a physical inspection.
5. After verification, the mutation certificate is issued.`,
    followUp: ["What documents are needed for land disputes?", "How are property taxes calculated?"]
  }
];

/**
 * Simulates an AI response by finding a relevant topic from the knowledge base.
 * @param {string} query The user's input.
 * @returns {object} An object with title, content, and follow-up questions.
 */
export const getExpertResponse = (query) => {
  const lowerQuery = query.toLowerCase();

  for (const topic of knowledgeBase) {
    // Check if any keyword from the topic is present in the user's query
    if (topic.keywords.some(keyword => lowerQuery.includes(keyword))) {
      return topic;
    }
  }

  // Fallback response if no topic matches
  return {
    title: "I can help with specific topics",
    content: "I'm sorry, I don't have detailed information on that specific query. I am an expert on topics related to Aadhaar, Land & Property, Pension Schemes, and Court Procedures.\n\nPlease try asking your question differently, or ask about one of those topics.",
    followUp: ["How to update Aadhaar?", "How to resolve a land dispute?"]
  };
};

/**
 * Simulates document summarization by looking for keywords.
 * @param {string} documentText The text from the document.
 * @returns {object} An object with a summary and key points.
 */
export const summarizeLocalDocument = (documentText) => {
    const lowerText = documentText.toLowerCase();
    let summary = "This document appears to be a ";
    const keyPoints = [];

    if (lowerText.includes("notice")) {
        summary += "legal notice. It likely requires a formal response.";
        keyPoints.push("Note the deadline for response mentioned in the notice.");
    } else if (lowerText.includes("sale deed") || lowerText.includes("registry")) {
        summary += "property Sale Deed. It outlines the transfer of ownership.";
        keyPoints.push("Verify the names of the buyer and seller.");
        keyPoints.push("Check the property description and measurements.");
    } else if (lowerText.includes("court") && (lowerText.includes("order") || lowerText.includes("summons"))) {
        summary += "court document, possibly a summons or an order.";
        keyPoints.push("Check the date and time for any required court appearance.");
        keyPoints.push("Identify the court name and case number.");
    } else {
        summary = "A general legal document was provided.";
    }

    if (lowerText.includes("property") || lowerText.includes("land")) {
        keyPoints.push("The document concerns a land or property matter.");
    }
    if (lowerText.includes("advocate") || lowerText.includes("lawyer")) {
        keyPoints.push("It is highly recommended to consult a lawyer regarding this document.");
    }

    if (keyPoints.length === 0) {
        keyPoints.push("Read the document carefully to understand its purpose.");
    }

    return { summary, keyPoints };
};