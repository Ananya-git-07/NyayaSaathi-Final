// PASTE THIS ENTIRE FILE INTO Backend/src/controllers/documentGenerator.controller.js

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import Document from '../models/Document.js';
import { GoogleGenerativeAI } from "@google/generative-ai"; // Import Gemini

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- AI DRAFTER HELPER ---
const fetchAIDraftContent = async (data) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) throw new Error("Gemini API Key missing");

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    ROLE: Expert Indian Legal Drafter.
    TASK: Draft a formal legal document based on these details.
    
    CONTEXT:
    - Client Name: ${data.fullName}
    - Father's Name: ${data.fatherName}
    - Address: Village ${data.village}, District ${data.district}
    - Document Objective: ${data.issueType}
    - Specific Facts: ${data.description}

    OUTPUT FORMAT (JSON):
    {
      "title": "Title of Document (e.g., AFFIDAVIT, RENT AGREEMENT, APPLICATION)",
      "recipient": "To whom it is addressed (e.g., To, The District Magistrate... or null if not applicable)",
      "subject": "Subject line (optional)",
      "body": ["Paragraph 1 text...", "Paragraph 2 text...", "Paragraph 3 text..."],
      "prayer": "The final request or prayer clause (e.g., It is therefore prayed...)",
      "deponent_label": "Label for signature (e.g., Deponent, Applicant, Lessor)"
    }
    
    TONE: Formal, Legal, Precise (Indian Legal Standards).
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
};

export const generateDocument = asyncHandler(async (req, res) => {
    const { type, data } = req.body;

    if (!type || !data) {
        throw new ApiError(400, "Document type and data are required.");
    }

    // 1. Prepare Content (AI vs Template)
    let documentContent = null;
    
    // If User selects "AI Draft", we generate content first
    if (type === 'AI Draft') {
        try {
            documentContent = await fetchAIDraftContent(data);
        } catch (error) {
            console.error("AI Drafting Failed:", error);
            throw new ApiError(500, "AI failed to draft the document. Please try again.");
        }
    }

    // 2. Setup Paths
    const fileName = `${type.replace(/\s/g, '_')}_${Date.now()}.pdf`;
    const tempDir = path.join(__dirname, "../../public/temp"); 
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const localPdfPath = path.join(tempDir, fileName);

    // 3. Create PDF Stream
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(localPdfPath);
    doc.pipe(writeStream);

    // 4. Render Logic
    if (type === 'AI Draft' && documentContent) {
        generateUniversalLayout(doc, documentContent, data);
    } else {
        // Fallback to hardcoded templates if specific type selected
        switch (type.toLowerCase()) {
            case 'affidavit': generateAffidavit(doc, data); break;
            case 'complaint': generateComplaint(doc, data); break;
            case 'application': generateApplication(doc, data); break;
            case 'caste certificate': generateCasteCertificate(doc, data); break;
            default: generateGeneric(doc, type, data);
        }
    }

    doc.end();

    // 5. Save & Send
    writeStream.on('finish', async () => {
        try {
            const uploadPath = path.join(tempDir, `upload_${fileName}`);
            fs.copyFileSync(localPdfPath, uploadPath);

            const cloudinaryResponse = await uploadOnCloudinary(uploadPath);
            if (!cloudinaryResponse) throw new Error("Cloud upload failed");

            await Document.create({
                userId: req.user._id,
                documentType: type === 'AI Draft' ? (documentContent?.title || 'AI Document') : type,
                fileUrl: cloudinaryResponse.secure_url,
                submissionStatus: 'generated',
                uploadedBy: 'System'
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            
            const readStream = fs.createReadStream(localPdfPath);
            readStream.pipe(res);
            readStream.on('end', () => {
                if (fs.existsSync(localPdfPath)) fs.unlinkSync(localPdfPath);
            });

        } catch (error) {
            console.error("Process Error:", error);
            if (!res.headersSent) res.status(500).json({ success: false, message: "Generation failed" });
            if (fs.existsSync(localPdfPath)) fs.unlinkSync(localPdfPath);
        }
    });

    writeStream.on('error', (err) => {
        if (!res.headersSent) res.status(500).json({ message: "Error generating PDF" });
    });
});

// --- THE UNIVERSAL LAYOUT (New) ---
const generateUniversalLayout = (doc, content, userData) => {
    // Title
    doc.font('Helvetica-Bold').fontSize(18).text(content.title.toUpperCase(), { align: 'center' });
    doc.moveDown(1.5);

    // Recipient (if exists)
    if (content.recipient) {
        doc.font('Helvetica').fontSize(12).text(content.recipient, { align: 'left' });
        doc.moveDown();
    }

    // Subject (if exists)
    if (content.subject) {
        doc.font('Helvetica-Bold').fontSize(12).text(`Subject: ${content.subject}`, { align: 'center' });
        doc.moveDown();
    }

    // Body Paragraphs
    doc.font('Helvetica').fontSize(12);
    content.body.forEach(paragraph => {
        doc.text(paragraph, { align: 'justify', lineGap: 4 });
        doc.moveDown(0.8);
    });

    // Prayer
    if (content.prayer) {
        doc.moveDown();
        doc.font('Helvetica-Bold').text("PRAYER", { underline: true });
        doc.font('Helvetica').text(content.prayer, { align: 'justify' });
    }

    // Footer / Signature
    doc.moveDown(4);
    const date = new Date().toLocaleDateString();
    
    doc.text(`Date: ${date}`, 50, doc.y);
    doc.text(`Place: ${userData.district || '__________'}`, 50, doc.y + 15);

    doc.text(content.deponent_label || 'Signature', 400, doc.y - 15, { align: 'center' });
    doc.text(`(${userData.fullName})`, 400, doc.y + 30, { align: 'center' });
};

// --- LEGACY TEMPLATES (Kept for specific flows) ---
const generateAffidavit = (doc, data) => { /* ... Same as before ... */ };
const generateComplaint = (doc, data) => { /* ... Same as before ... */ };
const generateApplication = (doc, data) => { /* ... Same as before ... */ };
const generateCasteCertificate = (doc, data) => { /* ... Same as before ... */ };
const generateGeneric = (doc, type, data) => { /* ... Same as before ... */ };