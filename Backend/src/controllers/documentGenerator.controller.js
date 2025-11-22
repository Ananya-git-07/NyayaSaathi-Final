// PASTE THIS ENTIRE FILE INTO Backend/src/controllers/documentGenerator.controller.js

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import Document from '../models/Document.js';

// Helper to get directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateDocument = asyncHandler(async (req, res) => {
    const { type, data } = req.body;

    if (!type || !data) {
        throw new ApiError(400, "Document type and data are required.");
    }

    // 1. Setup Paths
    const fileName = `${type}_${Date.now()}.pdf`;
    // Ensure we use the same temp folder logic as multer
    const tempDir = path.join(__dirname, "../../public/temp"); 
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const localPdfPath = path.join(tempDir, fileName);

    // 2. Create PDF Stream to File
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(localPdfPath);
    
    doc.pipe(writeStream);

    // 3. Generate Content (Template Logic)
    switch (type.toLowerCase()) {
        case 'affidavit': generateAffidavit(doc, data); break;
        case 'complaint': generateComplaint(doc, data); break;
        case 'application': generateApplication(doc, data); break;
        default: generateGeneric(doc, type, data);
    }

    doc.end();

    // 4. Handle Post-Generation (Upload & Save)
    writeStream.on('finish', async () => {
        try {
            // A. Create a copy for upload (because uploadOnCloudinary deletes the file)
            const uploadPath = path.join(tempDir, `upload_${fileName}`);
            fs.copyFileSync(localPdfPath, uploadPath);

            // B. Upload to Cloudinary
            const cloudinaryResponse = await uploadOnCloudinary(uploadPath);
            
            if (!cloudinaryResponse) {
                throw new Error("Failed to upload generated document.");
            }

            // C. Save Record to DB
            await Document.create({
                userId: req.user._id,
                documentType: type,
                fileUrl: cloudinaryResponse.secure_url,
                submissionStatus: 'generated', // Mark as auto-generated
                uploadedBy: 'System'
            });

            // D. Stream the ORIGINAL local file to the user
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            
            const readStream = fs.createReadStream(localPdfPath);
            readStream.pipe(res);

            // E. Cleanup local file after sending
            readStream.on('end', () => {
                if (fs.existsSync(localPdfPath)) fs.unlinkSync(localPdfPath);
            });

        } catch (error) {
            console.error("Generation/Upload Error:", error);
            // If headers not sent, send error
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: "Failed to process document generation." });
            }
            // Cleanup
            if (fs.existsSync(localPdfPath)) fs.unlinkSync(localPdfPath);
        }
    });

    writeStream.on('error', (err) => {
        console.error("PDF Write Error:", err);
        if (!res.headersSent) res.status(500).json({ message: "Error generating PDF" });
    });
});

// --- TEMPLATES (Unchanged) ---
const generateAffidavit = (doc, data) => {
    doc.fontSize(20).text('AFFIDAVIT', { align: 'center' }).moveDown(2);
    doc.fontSize(12).text(`I, ${data.fullName}, S/o ${data.fatherName || '_________'}, resident of ${data.village || '_________'}, ${data.district || '_________'}, do hereby solemnly affirm and declare:`, { align: 'justify', lineGap: 6 }).moveDown();
    doc.text(`1. That I am a citizen of India.`).moveDown();
    doc.text(`2. That the information regarding ${data.issueType} is true.`).moveDown();
    doc.text(`3. ${data.description || 'Statement of facts...'}`).moveDown(2);
    doc.text('Deponent', { align: 'right' }).moveDown(4);
    doc.fontSize(14).text('VERIFICATION', { align: 'center' }).moveDown();
    doc.fontSize(12).text('Verified that the contents above are true and correct.', { align: 'justify' });
    doc.moveDown(4);
    doc.text('Deponent', { align: 'right' });
};

const generateComplaint = (doc, data) => {
    doc.fontSize(12).text(`To, The District Magistrate, ${data.district || 'District'}`).moveDown();
    doc.fontSize(14).font('Helvetica-Bold').text(`Subject: Complaint regarding ${data.issueType}`, { align: 'center' }).moveDown();
    doc.fontSize(12).font('Helvetica').text(`Respected Sir/Madam,`, { align: 'left' }).moveDown();
    doc.text(`I, ${data.fullName}, resident of ${data.village}, beg to state:`, { align: 'justify' }).moveDown();
    doc.text(data.description || 'Details...', { align: 'justify', lineGap: 5 }).moveDown(2);
    doc.text('Yours Faithfully,', { align: 'right' });
    doc.text(`${data.fullName}`, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
};

const generateApplication = (doc, data) => {
    doc.fontSize(16).text('APPLICATION FORM', { align: 'center' }).moveDown(2);
    const fields = [
        { label: "Applicant Name", value: data.fullName },
        { label: "Father's Name", value: data.fatherName },
        { label: "Address", value: `${data.village}, ${data.district}` },
        { label: "Subject", value: data.issueType },
    ];
    fields.forEach(field => {
        doc.fontSize(12).font('Helvetica-Bold').text(`${field.label}:`, { continued: true });
        doc.font('Helvetica').text(`  ${field.value || '________________'}`).moveDown();
    });
    doc.moveDown(2);
    doc.font('Helvetica-Bold').text('Details:', { underline: true }).moveDown();
    doc.font('Helvetica').text(data.description || 'N/A', { align: 'justify' });
    doc.moveDown(4);
    doc.text('Signature', { align: 'right' });
};


const generateGeneric = (doc, type, data) => {
    doc.fontSize(20).text(type.toUpperCase(), { align: 'center' }).moveDown();
    doc.fontSize(12).text(JSON.stringify(data, null, 2));
};