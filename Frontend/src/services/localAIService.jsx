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

const knowledgeBaseHI = [
  // --- आधार विषय ---
  {
    keywords: ["आधार", "अपडेट", "सही", "बदलें", "पता", "नाम", "जन्म तिथि"],
    title: "अपना आधार कार्ड कैसे अपडेट करें",
    content: `आप अपने आधार विवरण को ऑनलाइन और ऑफलाइन दोनों तरीकों से अपडेट कर सकते हैं। यहाँ एक सरल गाइड है:

**1. ऑनलाइन अपडेट (पते के लिए):**
   - आधिकारिक UIDAI वेबसाइट पर जाएं: myaadhaar.uidai.gov.in
   - अपने आधार नंबर और पंजीकृत मोबाइल पर भेजे गए OTP का उपयोग करके लॉग इन करें।
   - "आधार ऑनलाइन अपडेट करें" चुनें।
   - वह जानकारी चुनें जिसे आप अपडेट करना चाहते हैं (जैसे, पता)।
   - अपने प्रमाण दस्तावेज़ की एक स्पष्ट, स्कैन की हुई प्रति अपलोड करें (जैसे हाल का बिजली बिल, बैंक पासबुक, या किराया समझौता)।
   - ₹50 का शुल्क ऑनलाइन भुगतान करें।
   - स्थिति को ट्रैक करने के लिए आपको एक अपडेट अनुरोध संख्या (URN) मिलेगी।

**2. ऑफलाइन अपडेट (नाम, जन्मतिथि, मोबाइल नंबर आदि के लिए):**
   - अपने निकटतम आधार सेवा केंद्र (ASK) या नामांकन केंद्र का पता लगाएं।
   - आधार सुधार फ़ॉर्म भरें।
   - अपने सहायक दस्तावेज़ों की मूल प्रतियों के साथ फ़ॉर्म जमा करें।
   - आपके बायोमेट्रिक्स (फिंगरप्रिंट और फोटो) लिए जाएंगे।
   - आवश्यक शुल्क का भुगतान करें (डेमोग्राफिक के लिए ₹50, बायोमेट्रिक अपडेट के लिए ₹100)।
   - आपको URN के साथ एक पावती पर्ची मिलेगी।`,
    followUp: ["पता बदलने के लिए कौन से दस्तावेज़ चाहिए?", "मैं अपना निकटतम आधार केंद्र कैसे ढूंढ सकता हूँ?"]
  },
  {
    keywords: ["आधार", "खो गया", "भूल गया", "डुप्लीकेट"],
    title: "अगर आपका आधार कार्ड खो जाए तो क्या करें",
    content: `अगर आपका कार्ड खो गया है तो चिंता न करें। आपका आधार नंबर ही महत्वपूर्ण है। इसे वापस पाने का तरीका यहां दिया गया है:

**1. डिजिटल ई-आधार डाउनलोड करें (सबसे तेज़ तरीका):**
   - UIDAI की वेबसाइट पर जाएं।
   - "आधार डाउनलोड करें" पर क्लिक करें।
   - अपना 12 अंकों का आधार नंबर या नामांकन आईडी दर्ज करें।
   - आपको अपने पंजीकृत मोबाइल नंबर पर एक OTP प्राप्त होगा।
   - पासवर्ड से सुरक्षित PDF डाउनलोड करने के लिए OTP दर्ज करें।
   - पासवर्ड आपके नाम के पहले 4 अक्षर (बड़े अक्षरों में) + आपके जन्म का वर्ष (YYYY) है। उदाहरण: 1990 में जन्मे RAMESH नाम के लिए, पासवर्ड "RAME1990" है।
   - यह ई-आधार हर जगह भौतिक कार्ड की तरह ही मान्य है।

**2. नया PVC कार्ड ऑर्डर करें:**
   - UIDAI वेबसाइट पर, आप ₹50 में एक टिकाऊ PVC कार्ड ऑर्डर कर सकते हैं। इसे डाक द्वारा आपके पंजीकृत पते पर भेजा जाएगा।`,
    followUp: ["मेरा मोबाइल नंबर आधार से लिंक नहीं है, मुझे क्या करना चाहिए?", "क्या ई-आधार हर जगह मान्य है?"]
  },
  // --- भूमि विषय ---
  {
    keywords: ["भूमि", "संपत्ति", "ज़मीन", "विवाद", "झगड़ा", "मुद्दा"],
    title: "भूमि विवादों का समाधान",
    content: `भूमि विवाद आम हैं और इन्हें कई माध्यमों से सुलझाया जा सकता है।

**1. राजस्व न्यायालय (तहसीलदार/कलेक्टर कार्यालय):**
   - **किसके लिए सर्वोत्तम:** सीमाओं, भूमि रिकॉर्ड सुधार, दाखिल-खारिज और किरायेदारी से संबंधित मुद्दों के लिए।
   - **प्रक्रिया:** तहसीलदार या उप-विभागीय मजिस्ट्रेट (एसडीएम) के पास एक आवेदन दायर करें। ये अदालतें रिकॉर्ड-संबंधी मुद्दों के लिए तेज़ होती हैं।

**2. दीवानी न्यायालय (सिविल कोर्ट):**
   - **किसके लिए सर्वोत्तम:** स्वामित्व, मालिकाना हक और संपत्ति विरासत पर गंभीर विवादों के लिए।
   - **प्रक्रिया:** इसमें एक वकील के माध्यम से एक औपचारिक दीवानी मुकदमा दायर करना शामिल है। यह एक लंबी प्रक्रिया हो सकती है लेकिन एक निश्चित निर्णय प्रदान करती है।

**3. लोक अदालत:**
   - **किसके लिए सर्वोत्तम:** दूसरे पक्ष के साथ समझौता करने के लिए।
   - **प्रक्रिया:** मामलों को जल्दी और सौहार्दपूर्ण ढंग से निपटाने के लिए समय-समय पर इनका आयोजन किया जाता है। निर्णय दोनों पक्षों पर बाध्यकारी होता है।

**आपको जिन मुख्य दस्तावेजों की आवश्यकता होगी:**
- विक्रय पत्र (रजिस्ट्री)
- अधिकार अभिलेख (खतौनी/जमाबंदी)
- सर्वेक्षण मानचित्र (नक्शा)
- संपत्ति कर की रसीदें`,
    followUp: ["भूमि का दाखिल-खारिज क्या है?", "विक्रय पत्र (सेल डीड) क्या है?"]
  },
  {
    keywords: ["दाखिल खारिज", "म्यूटेशन", "संपत्ति हस्तांतरण"],
    title: "भूमि दाखिल-खारिज (म्यूटेशन) को समझना",
    content: `दाखिल-खारिज स्थानीय नगरपालिका निकाय के भूमि राजस्व रिकॉर्ड में किसी संपत्ति के शीर्षक स्वामित्व को बदलने की प्रक्रिया है। संपत्ति खरीदने के बाद यह महत्वपूर्ण है।

**यह महत्वपूर्ण क्यों है?**
- यह आपको सरकारी रिकॉर्ड में नए कानूनी मालिक के रूप में स्थापित करता है।
- संपत्ति कर का सही भुगतान करने के लिए यह आवश्यक है।
- यदि आप भविष्य में संपत्ति बेचने की योजना बनाते हैं तो यह आवश्यक है।

**आवेदन कैसे करें:**
1. तहसील या स्थानीय नगरपालिका कार्यालय जाएं।
2. दाखिल-खारिज के लिए एक आवेदन पत्र जमा करें।
3. आवश्यक दस्तावेज संलग्न करें: विक्रय पत्र की प्रति, नवीनतम संपत्ति कर रसीद, और एक क्षतिपूर्ति बंधपत्र (इंडेम्निटी बांड)।
4. विभाग दस्तावेजों का सत्यापन करेगा और भौतिक निरीक्षण कर सकता है।
5. सत्यापन के बाद, दाखिल-खारिज प्रमाण पत्र जारी किया जाता है।`,
    followUp: ["भूमि विवाद के लिए कौन से दस्तावेज़ चाहिए?", "संपत्ति कर की गणना कैसे की जाती है?"]
  }
];

/**
 * Simulates an AI response by finding a relevant topic from the knowledge base.
 * @param {string} query The user's input.
 * @param {string} lang The current language ('en' or 'hi').
 * @returns {object} An object with title, content, and follow-up questions.
 */
export const getExpertResponse = (query, lang = 'en') => {
  const lowerQuery = query.toLowerCase();
  const base = lang.startsWith('hi') ? knowledgeBaseHI : knowledgeBase;

  for (const topic of base) {
    if (topic.keywords.some(keyword => lowerQuery.includes(keyword))) {
      return topic;
    }
  }

  // Fallback response if no topic matches
  return lang.startsWith('hi') ? {
    title: "मैं विशिष्ट विषयों में मदद कर सकता हूँ",
    content: "मुझे खेद है, मेरे पास उस विशिष्ट प्रश्न पर विस्तृत जानकारी नहीं है। मैं आधार, भूमि और संपत्ति, पेंशन योजनाओं, और न्यायालय प्रक्रियाओं से संबंधित विषयों का विशेषज्ञ हूँ।\n\nकृपया अपना प्रश्न अलग तरीके से पूछने का प्रयास करें, या उन विषयों में से किसी एक के बारे में पूछें।",
    followUp: ["आधार कैसे अपडेट करें?", "भूमि विवाद का समाधान कैसे करें?"]
  } : {
    title: "I can help with specific topics",
    content: "I'm sorry, I don't have detailed information on that specific query. I am an expert on topics related to Aadhaar, Land & Property, Pension Schemes, and Court Procedures.\n\nPlease try asking your question differently, or ask about one of those topics.",
    followUp: ["How to update Aadhaar?", "How to resolve a land dispute?"]
  };
};

/**
 * Simulates document summarization by looking for keywords.
 * @param {string} documentText The text from the document.
 * @param {string} lang The current language ('en' or 'hi').
 * @returns {object} An object with a summary and key points.
 */
export const summarizeLocalDocument = (documentText, lang = 'en') => {
    const lowerText = documentText.toLowerCase();
    const isHindi = lang.startsWith('hi');
    let summary = isHindi ? "यह दस्तावेज़ एक " : "This document appears to be a ";
    const keyPoints = [];

    if (lowerText.includes("notice") || lowerText.includes("नोटिस")) {
        summary += isHindi ? "कानूनी नोटिस लगता है। इसके लिए एक औपचारिक जवाब की आवश्यकता हो सकती है।" : "legal notice. It likely requires a formal response.";
        keyPoints.push(isHindi ? "नोटिस में उल्लिखित प्रतिक्रिया की अंतिम तिथि पर ध्यान दें।" : "Note the deadline for response mentioned in the notice.");
    } else if (lowerText.includes("sale deed") || lowerText.includes("registry") || lowerText.includes("विक्रय पत्र")) {
        summary += isHindi ? "संपत्ति का विक्रय पत्र (सेल डीड) लगता है। यह स्वामित्व के हस्तांतरण की रूपरेखा देता है।" : "property Sale Deed. It outlines the transfer of ownership.";
        keyPoints.push(isHindi ? "खरीदार और विक्रेता के नामों की पुष्टि करें।" : "Verify the names of the buyer and seller.");
        keyPoints.push(isHindi ? "संपत्ति के विवरण और माप की जाँच करें।" : "Check the property description and measurements.");
    } else if ((lowerText.includes("court") || lowerText.includes("न्यायालय")) && (lowerText.includes("order") || lowerText.includes("summons") || lowerText.includes("आदेश") || lowerText.includes("समन"))) {
        summary += isHindi ? "न्यायालय का दस्तावेज़ लगता है, संभवतः एक समन या एक आदेश।" : "court document, possibly a summons or an order.";
        keyPoints.push(isHindi ? "किसी भी आवश्यक अदालती उपस्थिति के लिए तारीख और समय की जाँच करें।" : "Check the date and time for any required court appearance.");
        keyPoints.push(isHindi ? "अदालत का नाम और केस नंबर पहचानें।" : "Identify the court name and case number.");
    } else {
        summary = isHindi ? "एक सामान्य कानूनी दस्तावेज़ प्रदान किया गया।" : "A general legal document was provided.";
    }

    if (lowerText.includes("property") || lowerText.includes("land") || lowerText.includes("संपत्ति") || lowerText.includes("भूमि")) {
        keyPoints.push(isHindi ? "दस्तावेज़ भूमि या संपत्ति के मामले से संबंधित है।" : "The document concerns a land or property matter.");
    }
    if (lowerText.includes("advocate") || lowerText.includes("lawyer") || lowerText.includes("वकील") || lowerText.includes("अधिवक्ता")) {
        keyPoints.push(isHindi ? "इस दस्तावेज़ के संबंध में एक वकील से परामर्श करने की अत्यधिक अनुशंसा की जाती है।" : "It is highly recommended to consult a lawyer regarding this document.");
    }

    if (keyPoints.length === 0) {
        keyPoints.push(isHindi ? "इसका उद्देश्य समझने के लिए दस्तावेज़ को ध्यान से पढ़ें।" : "Read the document carefully to understand its purpose.");
    }

    return { summary, keyPoints };
};