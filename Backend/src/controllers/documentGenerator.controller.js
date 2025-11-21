// PASTE THIS ENTIRE FILE INTO Backend/src/controllers/documentGenerator.controller.js

import PDFDocument from 'pdfkit';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Generates a PDF document based on structured input data.
 * @route POST /api/documents/generate
 */
export const generateDocument = asyncHandler(async (req, res) => {
    const { type, data } = req.body;
    // data should contain: fullName, fatherName, village, district, description, etc.

    if (!type || !data) {
        throw new ApiError(400, "Document type and data are required.");
    }

    // Create a document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers to trigger download
    const filename = `${type}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    // Pipe the PDF into the response
    doc.pipe(res);

    // --- TEMPLATE SELECTION LOGIC ---
    switch (type.toLowerCase()) {
        case 'affidavit':
            generateAffidavit(doc, data);
            break;
        case 'complaint':
            generateComplaint(doc, data);
            break;
        case 'application':
            generateApplication(doc, data);
            break;
        default:
            // Default generic template
            generateGeneric(doc, type, data);
    }

    // Finalize PDF file
    doc.end();
});

// --- TEMPLATE 1: AFFIDAVIT (General Purpose) ---
const generateAffidavit = (doc, data) => {
    doc.fontSize(20).text('AFFIDAVIT', { align: 'center' }).moveDown(2);

    doc.fontSize(12).text(`I, ${data.fullName}, S/o ${data.fatherName || '_________'}, aged about ${data.age || '___'} years, resident of Village ${data.village || '_________'}, District ${data.district || '_________'}, do hereby solemnly affirm and declare as under:`, {
        align: 'justify',
        lineGap: 6
    }).moveDown();

    doc.text(`1. That I am a citizen of India and resident of the above-mentioned address.`).moveDown();
    doc.text(`2. That the information provided regarding my issue (${data.issueType || 'General Issue'}) is true to the best of my knowledge.`).moveDown();
    doc.text(`3. ${data.description || 'Statement of facts...'}`).moveDown(2);

    doc.text('Deponent', { align: 'right' }).moveDown(4);

    doc.fontSize(14).text('VERIFICATION', { align: 'center' }).moveDown();
    doc.fontSize(12).text('Verified at _________ on this ____ day of _________ 202_, that the contents of the above affidavit are true and correct to the best of my knowledge and nothing has been concealed therefrom.', { align: 'justify' });
    
    doc.moveDown(4);
    doc.text('Deponent', { align: 'right' });
};

// --- TEMPLATE 2: OFFICIAL COMPLAINT (For Police/Admin) ---
const generateComplaint = (doc, data) => {
    doc.fontSize(12).text(`To,`, { align: 'left' });
    doc.text(`The ${data.officialTitle || 'District Magistrate'},`);
    doc.text(`${data.district || 'District Name'}`).moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text(`Subject: Complaint regarding ${data.issueType}`, { align: 'center' }).moveDown();
    
    doc.fontSize(12).font('Helvetica').text(`Respected Sir/Madam,`, { align: 'left' }).moveDown();

    doc.text(`I, ${data.fullName}, resident of ${data.village}, beg to state the following:`, { align: 'justify' }).moveDown();
    
    doc.text(data.description || '[Detailed description of the incident or issue goes here...]', {
        align: 'justify',
        lineGap: 5
    }).moveDown(2);

    doc.text(`I request you to kindly investigate this matter and take necessary legal action.`, { align: 'justify' }).moveDown(2);

    doc.text('Yours Faithfully,', { align: 'right' });
    doc.text(`${data.fullName}`, { align: 'right' });
    doc.text(`Mob: ${data.phoneNumber || '__________'}`, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
};

// --- TEMPLATE 3: GENERIC APPLICATION ---
const generateApplication = (doc, data) => {
    doc.fontSize(16).text('APPLICATION FORM', { align: 'center' }).moveDown(2);
    
    const fields = [
        { label: "Applicant Name", value: data.fullName },
        { label: "Father's Name", value: data.fatherName },
        { label: "Village/Address", value: data.village },
        { label: "District", value: data.district },
        { label: "Aadhaar Number", value: data.aadhaarNumber },
        { label: "Application For", value: data.issueType },
    ];

    fields.forEach(field => {
        doc.fontSize(12).font('Helvetica-Bold').text(`${field.label}:`, { continued: true });
        doc.font('Helvetica').text(`  ${field.value || '________________'}`).moveDown();
    });

    doc.moveDown(2);
    doc.font('Helvetica-Bold').text('Subject/Reason:', { underline: true }).moveDown();
    doc.font('Helvetica').text(data.description || 'N/A', { align: 'justify' });

    doc.moveDown(4);
    doc.text('Signature of Applicant', { align: 'right' });
};

const generateGeneric = (doc, type, data) => {
    doc.fontSize(20).text(type.toUpperCase(), { align: 'center' }).moveDown();
    doc.fontSize(12).text(JSON.stringify(data, null, 2));
};