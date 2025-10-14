// This service handles fetching legal information from various sources
// and provides a unified interface for the smart assistant

const INDIAN_KANOON_API_BASE = "https://api.indiankanoon.org/search/"
const LEGAL_API_KEY = process.env.REACT_APP_GROQ_API_KEY||"demo_key"

// Comprehensive knowledge base of Indian laws
const indianLegalKnowledge = {
  // Land Laws
  land: {
    acts: [
      {
        name: "Land Acquisition Act, 2013",
        description:
          "The Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013 replaced the Land Acquisition Act, 1894. It provides fair compensation to those whose land is taken away, brings transparency to the process of acquisition of land, and assures rehabilitation of those affected.",
        keyProvisions: [
          "Fair compensation at 2-4 times market value",
          "Social Impact Assessment mandatory",
          "Consent of 70-80% landowners required",
          "Rehabilitation and resettlement provisions",
        ],
      },
      {
        name: "Registration Act, 1908",
        description:
          "Governs the registration of documents related to transfer of immovable property. Registration provides evidence that the apparent owner is the real owner and prevents fraud.",
        keyProvisions: [
          "Compulsory registration of property documents",
          "Time limit of 4 months for registration",
          "Registration fees and stamp duty requirements",
          "Procedure for registration at Sub-Registrar office",
        ],
      },
      {
        name: "Transfer of Property Act, 1882",
        description:
          "Regulates the transfer of property between living persons. It deals with sale, mortgage, lease, exchange, and gift of immovable property.",
        keyProvisions: [
          "Rules for valid property transfers",
          "Rights and liabilities of buyers and sellers",
          "Conditions for mortgages and leases",
          "Restrictions on transfers in certain cases",
        ],
      },
    ],
    disputes: {
      title: "Land title disputes are common in India due to inadequate land records. Resolution mechanisms include:",
      mechanisms: [
        "Revenue Courts: Handle boundary disputes, land records corrections",
        "Civil Courts: Address ownership disputes, property rights",
        "Lok Adalats: Alternative dispute resolution for faster settlement",
        "Gram Nyayalayas: Village courts for rural land disputes",
      ],
      documents: [
        "Sale Deed (proof of ownership)",
        "Record of Rights (RTC/Khatauni/Jamabandi)",
        "Survey documents (showing boundaries)",
        "Tax receipts (evidence of possession)",
        "Encumbrance Certificate (showing property is free from legal liabilities)",
      ],
    },
    mutation: {
      description:
        "Mutation is the process of transferring or changing the title ownership of a property in land revenue records after the property is sold or transferred.",
      process: [
        "Submit application at Tehsil/Taluka office",
        "Attach sale deed, previous RTC, and ID proof",
        "Pay prescribed fee (varies by state)",
        "Notice period for objections (15-30 days)",
        "Field verification by revenue officials",
        "Entry in land records if no valid objections",
      ],
    },
  },

  // Aadhaar Laws
  aadhaar: {
    acts: [
      {
        name: "Aadhaar Act, 2016",
        description:
          "The Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act provides legal backing to the Aadhaar identity number project. It aims to provide good governance and efficient, transparent, and targeted delivery of subsidies, benefits, and services.",
        keyProvisions: [
          "Voluntary enrollment for benefits",
          "Privacy and security of identity information",
          "Restrictions on sharing information",
          "Penalties for unauthorized disclosure",
        ],
      },
    ],
    procedures: {
      enrollment: {
        steps: [
          "Visit nearest Aadhaar enrollment center",
          "Fill enrollment form with demographic details",
          "Provide proof of identity, address, and date of birth",
          "Complete biometric capture (fingerprints, iris scan, photograph)",
          "Receive enrollment acknowledgment slip",
          "Aadhaar generated and delivered within 90 days",
        ],
        documents: [
          "Identity Proof: Passport, PAN card, Voter ID, Driving license",
          "Address Proof: Utility bill, Bank statement, Rental agreement",
          "Date of Birth: Birth certificate, School certificate, Passport",
        ],
      },
      update: {
        steps: [
          "Visit Aadhaar Seva Kendra or enrollment center",
          "Fill correction/update form",
          "Submit supporting documents for the update",
          "Pay fee (₹50 for demographic, ₹100 for biometric updates)",
          "Receive acknowledgment slip with Update Request Number (URN)",
          "Track status online using URN",
        ],
        online: [
          "Visit UIDAI website (uidai.gov.in) or mAadhaar app",
          "Login using Aadhaar number and registered mobile OTP",
          "Select update details option",
          "Upload scanned supporting documents",
          "Pay fee online",
          "Track status using URN",
        ],
      },
    },
    legal: {
      supreme_court:
        "In 2018, the Supreme Court upheld the constitutional validity of Aadhaar but struck down Section 57, which allowed private entities to use Aadhaar for verification. The court mandated that Aadhaar is mandatory only for filing income tax returns and for availing government subsidies and benefits.",
      privacy:
        "The Supreme Court recognized privacy as a fundamental right under Article 21 of the Constitution in the context of Aadhaar. UIDAI has implemented various security measures including Virtual ID, limited KYC, and biometric locking to protect privacy.",
    },
  },

  // Court Procedures
  court: {
    hierarchy: [
      {
        level: "Supreme Court",
        jurisdiction: "Highest court, constitutional matters, appeals from High Courts",
        location: "New Delhi",
      },
      {
        level: "High Courts",
        jurisdiction: "State level, original and appellate jurisdiction",
        count: "25 High Courts across India",
      },
      {
        level: "District Courts",
        jurisdiction: "Civil and criminal cases at district level",
        types: "Sessions Court, Family Court, etc.",
      },
      {
        level: "Lower Courts",
        jurisdiction: "Small claims, petty offenses",
        types: "Magistrate Courts, Small Causes Courts",
      },
    ],
    procedures: {
      civil: {
        filing: [
          "Prepare plaint with cause of action, relief sought",
          "Pay court fees based on claim value",
          "Submit plaint with supporting documents",
          "Court issues summons to defendant",
          "Defendant files written statement (defense)",
          "Framing of issues by court",
          "Evidence presentation and witness examination",
          "Final arguments and judgment",
        ],
        documents: [
          "Plaint (formal complaint)",
          "Vakalatnama (lawyer authorization)",
          "Supporting documents and evidence",
          "Affidavits of witnesses",
          "Court fee receipt",
        ],
      },
      criminal: {
        filing: [
          "File FIR at police station (cognizable offenses)",
          "Police investigation and chargesheet filing",
          "Court takes cognizance and issues summons/warrant",
          "Accused appears and charges are framed",
          "Prosecution presents evidence",
          "Statement of accused recorded",
          "Defense evidence presented",
          "Final arguments and judgment",
        ],
        rights: [
          "Right to remain silent",
          "Right to know the accusation",
          "Right to legal representation",
          "Right to fair and speedy trial",
          "Protection against self-incrimination",
        ],
      },
      summons: {
        response: [
          "Appear in court on specified date and time",
          "Bring identification and case-related documents",
          "Hire a lawyer or request legal aid if needed",
          "File written statement/reply within prescribed time",
          "Apply for adjournment if unable to attend (with valid reason)",
        ],
        consequences: [
          "Non-appearance may result in ex-parte proceedings",
          "Court may issue bailable/non-bailable warrant",
          "Property attachment possible in civil cases",
          "Contempt of court charges in some cases",
        ],
      },
    },
    alternative_dispute_resolution: [
      {
        name: "Lok Adalat",
        description: "People's Court for amicable settlement, decisions binding",
        benefits: "Free of cost, speedy justice, no appeal",
      },
      {
        name: "Mediation",
        description: "Neutral third party facilitates negotiation between parties",
        benefits: "Confidential, preserves relationships, flexible solutions",
      },
      {
        name: "Arbitration",
        description: "Private dispute resolution with binding decision by arbitrator",
        benefits: "Expert decision-makers, faster than courts, enforceable awards",
      },
    ],
  },

  // Pension and Social Security
  pension: {
    schemes: [
      {
        name: "National Pension System (NPS)",
        eligibility: "Indian citizens aged 18-65 years",
        benefits: "Tax benefits, market-linked returns, partial withdrawal allowed",
        process: "Apply through bank, PFRDA-registered PoP, or online",
      },
      {
        name: "Indira Gandhi National Old Age Pension Scheme",
        eligibility: "BPL citizens above 60 years",
        benefits: "₹200-500 monthly pension",
        process: "Apply at local Panchayat/Municipality office",
      },
      {
        name: "Widow Pension Scheme",
        eligibility: "Widows aged 18+ from BPL families",
        benefits: "₹300-500 monthly pension (varies by state)",
        process: "Apply at local Tehsil office with death certificate",
      },
      {
        name: "Disability Pension Scheme",
        eligibility: "Persons with 40%+ disability from BPL families",
        benefits: "₹300-1500 monthly pension (varies by state)",
        process: "Apply with disability certificate from civil surgeon",
      },
    ],
    documents: [
      "Identity proof (Aadhaar/Voter ID)",
      "Age proof (Birth certificate/School certificate)",
      "Income certificate (for means-tested schemes)",
      "Bank account details for direct benefit transfer",
      "Passport size photographs",
      "Residence proof",
      "Category-specific documents (death certificate for widow pension, disability certificate for disability pension)",
    ],
  },

  // Certificates
  certificates: {
    income: {
      purpose: "Proves annual income for scholarships, subsidies, fee concessions",
      validity: "Usually 1 year from date of issue",
      process: [
        "Apply at Tehsil/SDM office or online portal",
        "Submit application form with ID proof",
        "Provide income proof documents",
        "Field verification by revenue officials",
        "Certificate issued within 7-30 days",
      ],
      documents: [
        "Application form",
        "Identity proof (Aadhaar/Voter ID)",
        "Residence proof",
        "Salary slips/Income tax returns (if applicable)",
        "Self-declaration of income (for informal sector)",
        "Passport size photographs",
      ],
    },
    caste: {
      purpose: "Proves belonging to SC/ST/OBC category for reservations and benefits",
      validity: "Permanent (once issued)",
      process: [
        "Apply at Tehsil/SDM office or online portal",
        "Submit application with proof of caste",
        "Provide family lineage documents",
        "Verification by revenue and social welfare departments",
        "Certificate issued after verification",
      ],
      documents: [
        "Application form",
        "Identity proof",
        "Parent's caste certificate",
        "Birth certificate",
        "School certificates showing caste",
        "Family ration card",
        "Affidavit declaring caste",
      ],
    },
    domicile: {
      purpose: "Proves residence in a state for education, jobs, property rights",
      validity: "Varies by state (1-5 years or permanent)",
      process: [
        "Apply at Tehsil/SDM office or state portal",
        "Submit proof of residence duration",
        "Field verification of residence",
        "Certificate issued after verification",
      ],
      documents: [
        "Application form",
        "Identity proof",
        "Residence proof for required duration (varies by state)",
        "Birth certificate/School certificates",
        "Electricity/water bills in name",
        "Rental agreement or property documents",
        "Affidavit declaring residence period",
      ],
    },
  },
}

// Function to search Indian legal knowledge base
const searchLegalKnowledge = (query) => {
  query = query.toLowerCase()

  // Search results object
  const results = {
    found: false,
    category: null,
    data: null,
    summary: "No specific information found for your query.",
  }

  // Check for land related queries
  if (
    query.includes("land") ||
    query.includes("property") ||
    query.includes("real estate") ||
    query.includes("mutation") ||
    query.includes("zameen") ||
    query.includes("bhumi")
  ) {
    results.found = true
    results.category = "land"

    if (query.includes("dispute") || query.includes("conflict") || query.includes("issue")) {
      results.data = indianLegalKnowledge.land.disputes
      results.summary =
        "Land disputes in India are resolved through Revenue Courts, Civil Courts, Lok Adalats, or Gram Nyayalayas. Important documents include Sale Deed, Record of Rights, Survey documents, and Tax receipts."
    } else if (query.includes("mutation") || query.includes("transfer") || query.includes("name change")) {
      results.data = indianLegalKnowledge.land.mutation
      results.summary =
        "Land mutation is the process of transferring property ownership in revenue records. Submit application at Tehsil office with sale deed, pay fees, and wait for verification and processing."
    } else {
      results.data = indianLegalKnowledge.land
      results.summary =
        "Land laws in India include the Land Acquisition Act 2013, Registration Act 1908, and Transfer of Property Act 1882. These govern property rights, transfers, and compensation for acquisition."
    }
  }

  // Check for Aadhaar related queries
  else if (
    query.includes("aadhaar") ||
    query.includes("aadhar") ||
    query.includes("uid") ||
    query.includes("unique id") ||
    query.includes("biometric")
  ) {
    results.found = true
    results.category = "aadhaar"

    if (query.includes("update") || query.includes("correct") || query.includes("change")) {
      results.data = indianLegalKnowledge.aadhaar.procedures.update
      results.summary =
        "To update Aadhaar, visit an Aadhaar Seva Kendra with supporting documents, pay ₹50 for demographic or ₹100 for biometric updates. You can also update online through the UIDAI website or mAadhaar app."
    } else if (query.includes("enroll") || query.includes("apply") || query.includes("get")) {
      results.data = indianLegalKnowledge.aadhaar.procedures.enrollment
      results.summary =
        "For Aadhaar enrollment, visit an enrollment center with identity, address, and birth proof documents. After biometric capture, you'll receive an acknowledgment slip and your Aadhaar within 90 days."
    } else if (
      query.includes("supreme") ||
      query.includes("court") ||
      query.includes("legal") ||
      query.includes("privacy")
    ) {
      results.data = indianLegalKnowledge.aadhaar.legal
      results.summary =
        "The Supreme Court upheld Aadhaar's constitutional validity in 2018 but restricted its mandatory use to tax filing and government benefits. Privacy protections include Virtual ID and limited KYC."
    } else {
      results.data = indianLegalKnowledge.aadhaar
      results.summary =
        "Aadhaar is governed by the Aadhaar Act 2016, which provides for voluntary enrollment, privacy protections, and targeted delivery of subsidies and benefits through the unique identification number."
    }
  }

  // Check for court related queries
  else if (
    query.includes("court") ||
    query.includes("legal") ||
    query.includes("case") ||
    query.includes("lawsuit") ||
    query.includes("judge") ||
    query.includes("summon")
  ) {
    results.found = true
    results.category = "court"

    if (query.includes("summon") || query.includes("notice")) {
      results.data = indianLegalKnowledge.court.procedures.summons
      results.summary =
        "When you receive a court summons, appear on the specified date with identification and relevant documents. Hire a lawyer if needed. Non-appearance may result in ex-parte proceedings or warrants."
    } else if (query.includes("civil") || query.includes("property case") || query.includes("money")) {
      results.data = indianLegalKnowledge.court.procedures.civil
      results.summary =
        "For civil cases, prepare a plaint with cause of action and relief sought, pay court fees, submit documents, and follow the process of summons, written statements, evidence presentation, and arguments."
    } else if (query.includes("criminal") || query.includes("fir") || query.includes("police")) {
      results.data = indianLegalKnowledge.court.procedures.criminal
      results.summary =
        "Criminal cases start with an FIR, followed by police investigation, chargesheet filing, court proceedings, evidence presentation, and judgment. Accused have rights to silence, legal representation, and fair trial."
    } else if (
      query.includes("lok adalat") ||
      query.includes("mediation") ||
      query.includes("arbitration") ||
      query.includes("settlement")
    ) {
      results.data = indianLegalKnowledge.court.alternative_dispute_resolution
      results.summary =
        "Alternative dispute resolution options include Lok Adalat (people's court), Mediation (facilitated negotiation), and Arbitration (private binding decision). These are faster and often less expensive than regular courts."
    } else {
      results.data = indianLegalKnowledge.court
      results.summary =
        "India's court system has a four-tier hierarchy: Supreme Court, High Courts, District Courts, and Lower Courts. Each has specific jurisdiction and follows established procedures for civil and criminal cases."
    }
  }

  // Check for pension related queries
  else if (
    query.includes("pension") ||
    query.includes("retirement") ||
    query.includes("old age") ||
    query.includes("widow") ||
    query.includes("disability benefit")
  ) {
    results.found = true
    results.category = "pension"
    results.data = indianLegalKnowledge.pension
    results.summary =
      "India offers various pension schemes including the National Pension System, Old Age Pension Scheme, Widow Pension, and Disability Pension. Eligibility and benefits vary by scheme, with most requiring identity, age, and income proof documents."
  }

  // Check for certificate related queries
  else if (query.includes("certificate") || query.includes("document") || query.includes("proof")) {
    results.found = true
    results.category = "certificates"

    if (query.includes("income") || query.includes("salary") || query.includes("earning")) {
      results.data = indianLegalKnowledge.certificates.income
      results.summary =
        "Income certificates prove annual income for scholarships and subsidies. Apply at Tehsil office with identity proof and income documents. Valid for 1 year, issued after verification within 7-30 days."
    } else if (query.includes("caste") || query.includes("sc") || query.includes("st") || query.includes("obc")) {
      results.data = indianLegalKnowledge.certificates.caste
      results.summary =
        "Caste certificates prove SC/ST/OBC status for reservations. Apply at Tehsil office with family lineage documents and parent's caste certificate. These are permanent once issued after verification."
    } else if (query.includes("domicile") || query.includes("resident") || query.includes("local")) {
      results.data = indianLegalKnowledge.certificates.domicile
      results.summary =
        "Domicile certificates prove state residence for education quotas and jobs. Apply with residence proof for the required duration (varies by state). Validity ranges from 1-5 years or permanent depending on state rules."
    } else {
      results.data = indianLegalKnowledge.certificates
      results.summary =
        "Common certificates include income (for benefits), caste (for reservations), and domicile (for state quotas). Each requires specific documents and follows application processes through Tehsil or SDM offices."
    }
  }

  return results
}

// Function to search Indian Kanoon API (for actual case law)
// Note: This is a simulated API call as the actual API requires paid subscription
const searchIndianKanoon = async (query) => {
  try {
    // In a real implementation, this would be an actual API call
    // const response = await axios.get(`${INDIAN_KANOON_API_BASE}?formInput=${query}`, {
    //   headers: { 'Authorization': `Bearer ${LEGAL_API_KEY}` }
    // });

    // Simulated response
    const simulatedResponse = {
      status: 200,
      data: {
        count: 5,
        docs: [
          {
            title: "Supreme Court: Land Acquisition Case",
            snippet: "Compensation must be fair and adequate as per market value...",
            link: "https://indiankanoon.org/doc/sample1/",
          },
          {
            title: "High Court: Property Dispute",
            snippet: "Proper documentation and registration is essential for property transfers...",
            link: "https://indiankanoon.org/doc/sample2/",
          },
        ],
      },
    }

    return {
      success: true,
      results: simulatedResponse.data.docs,
      count: simulatedResponse.data.count,
    }
  } catch (error) {
    console.error("Error searching Indian Kanoon:", error)
    return {
      success: false,
      error: "Failed to fetch case law information",
    }
  }
}

// Main function to get comprehensive legal information
export const getLegalInformation = async (query) => {
  // First search our knowledge base
  const knowledgeResults = searchLegalKnowledge(query)

  // Then try to get case law (if needed and available)
  let caseResults = { success: false, results: [] }
  if (query.includes("case") || query.includes("judgment") || query.includes("ruling")) {
    caseResults = await searchIndianKanoon(query)
  }

  return {
    query,
    knowledgeBase: knowledgeResults,
    caseLaw: caseResults,
    timestamp: new Date().toISOString(),
  }
}

// Function to summarize legal documents
export const summarizeLegalDocument = async (documentText) => {
  try {
    // In a real implementation, this would call an AI service API
    // For now, we'll simulate a response

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return {
      success: true,
      summary:
        "This document appears to be a legal notice regarding property dispute. Key points include: 1) Contested property in Mathura district, 2) Claim based on ancestral ownership, 3) Requires response within 30 days, 4) Mentions previous court order from 2018.",
      documentType: "Legal Notice",
      keyPoints: [
        "Property dispute in Mathura district",
        "Ancestral ownership claim",
        "30-day response timeline",
        "References previous court order",
      ],
      recommendations: [
        "Consult a property lawyer immediately",
        "Gather ownership documents",
        "Prepare formal written response",
        "Consider mediation options",
      ],
    }
  } catch (error) {
    console.error("Error summarizing document:", error)
    return {
      success: false,
      error: "Failed to summarize document",
    }
  }
}

export default {
  getLegalInformation,
  summarizeLegalDocument,
}
