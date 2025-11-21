import { Router } from "express";
import Document from "../models/Document.js";
import LegalIssue from "../models/LegalIssue.js";
import { upload, cleanupTempFile } from "../middleware/multer.middleware.js";
import { uploadOnCloudinary, generateSignedUrl } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

// === CREATE: Upload a new document ===
router.post("/upload", upload.single("documentFile"), async (req, res, next) => {
  let tempFilePath = req.file ? req.file.path : null;
  try {
    const { issueId, documentType } = req.body;
    if (!documentType || !documentType.trim()) throw new ApiError(400, "Document type is required.");
    if (!req.file) throw new ApiError(400, "A document file is required for upload.");
    
    // Detect file type properly from both MIME type and extension
    const mimeType = req.file.mimetype;
    const fileName = (req.file.originalname || '').toLowerCase();
    const isPng = mimeType === 'image/png' || fileName.endsWith('.png');
    const isJpeg = mimeType === 'image/jpeg' || mimeType === 'image/jpg' || fileName.endsWith('.jpeg') || fileName.endsWith('.jpg');
    
    // Use 'image' resource type for PNG and JPEG to enable image optimizations
    const resourceType = 'image';
    
    const cloudinaryResponse = await uploadOnCloudinary(tempFilePath, {
      resource_type: resourceType
    });
    
    if (!cloudinaryResponse || !(cloudinaryResponse.secure_url || cloudinaryResponse.url)) {
      throw new ApiError(500, "Failed to upload document to cloud storage.");
    }

    // Determine format from Cloudinary response or file extension
    let fileFormat = cloudinaryResponse.format;
    if (!fileFormat) {
      // Extract format from filename if Cloudinary didn't provide it
      const fileExtMatch = fileName.match(/\.([a-z0-9]+)$/i);
      if (fileExtMatch) {
        fileFormat = fileExtMatch[1].toLowerCase();
      }
    }

    console.log(`Document uploaded: ${fileName}, format: ${fileFormat}, resourceType: ${cloudinaryResponse.resource_type}`);

    const newDocument = await Document.create({
      userId: req.user._id,
      issueId: issueId || undefined,
      documentType,
      fileUrl: cloudinaryResponse.secure_url || (cloudinaryResponse.url?.replace(/^http:/, 'https:')),
      publicId: cloudinaryResponse.public_id,
      resourceType: cloudinaryResponse.resource_type,
      format: fileFormat,
      submissionStatus: "submitted",
    });

    if (issueId) {
        await LegalIssue.findByIdAndUpdate(issueId, {
            $push: {
                documents: newDocument._id,
                history: {
                    event: 'Document Uploaded',
                    details: `Document: ${documentType}`,
                    actor: 'User'
                }
            }
        });
    }

    const populatedDoc = await Document.findById(newDocument._id).populate("userId", "fullName email");
    return res.status(201).json(new ApiResponse(201, populatedDoc, "Document uploaded successfully."));
  } catch (error) {
    return next(error);
  } finally {
    if (tempFilePath) cleanupTempFile(tempFilePath);
  }
});

// === READ: Get all documents for the logged-in user ===
router.get("/", async (req, res, next) => {
  try {
    const documents = await Document.find({ userId: req.user._id, isDeleted: false })
      .populate("issueId", "issueType status")
      .sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, documents, "Documents retrieved successfully."));
  } catch (error) {
    return next(error);
  }
});

// === READ: Get a single document by its ID ===
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await Document.findOne({ _id: id, isDeleted: false })
      .populate("userId", "fullName email")
      .populate("issueId", "issueType description status");
    
    if (!document) {
      throw new ApiError(404, "Document not found.");
    }

    // Check access: owner, admin, or assigned paralegal can view
    const isOwner = document.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    let hasAccessViaIssue = false;
    if (document.issueId && req.user.role === 'paralegal') {
      // Import Paralegal model dynamically
      const Paralegal = (await import('../models/Paralegal.js')).default;
      const paralegalDoc = await Paralegal.findOne({ user: req.user._id });
      
      // Check if this paralegal is assigned to the issue
      const LegalIssue = (await import('../models/LegalIssue.js')).default;
      const issue = await LegalIssue.findById(document.issueId);
      if (issue && paralegalDoc && issue.assignedParalegal?.toString() === paralegalDoc._id.toString()) {
        hasAccessViaIssue = true;
      }
    }

    if (!isOwner && !isAdmin && !hasAccessViaIssue) {
      throw new ApiError(403, "Access denied.");
    }

    return res.status(200).json(new ApiResponse(200, document, "Document retrieved successfully."));
  } catch (error) {
    return next(error);
  }
});

// === PROXY DOCUMENT: Download and serve document through backend to bypass Cloudinary restrictions ===
router.get("/:id/download", async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await Document.findOne({ _id: id, isDeleted: false })
      .populate("userId", "fullName email")
      .populate("issueId", "issueType");
    
    if (!document) {
      throw new ApiError(404, "Document not found.");
    }

    // Check access permissions
    const isOwner = document.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    let hasAccessViaIssue = false;
    if (document.issueId && req.user.role === 'paralegal') {
      const Paralegal = (await import('../models/Paralegal.js')).default;
      const paralegalDoc = await Paralegal.findOne({ user: req.user._id });
      const LegalIssue = (await import('../models/LegalIssue.js')).default;
      const issue = await LegalIssue.findById(document.issueId);
      if (issue && paralegalDoc && issue.assignedParalegal?.toString() === paralegalDoc._id.toString()) {
        hasAccessViaIssue = true;
      }
    }

    if (!isOwner && !isAdmin && !hasAccessViaIssue) {
      throw new ApiError(403, "Access denied.");
    }

    // Use Cloudinary Admin API to fetch the resource directly
    const { v2: cloudinary } = (await import('cloudinary'));
    
    // Configure cloudinary (it should already be configured, but ensure it)
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    try {
      // Get resource details including the URL
      const resource = await cloudinary.api.resource(document.publicId, {
        resource_type: document.resourceType || 'raw',
        type: 'upload'
      });
      
      // Use the API-authenticated URL to fetch the file
      const authenticatedUrl = resource.secure_url || resource.url;
      
      const axios = (await import('axios')).default;
      const fileResponse = await axios.get(authenticatedUrl, {
        responseType: 'arraybuffer',  // Get as buffer instead of stream
        timeout: 30000,
        headers: {
          'User-Agent': 'NyayaSaathi/1.0'
        }
      });

      // Determine correct content type based on format
      let contentType = fileResponse.headers['content-type'];
      
      // If content-type not available from response, determine from document format
      if (!contentType || contentType === 'application/octet-stream') {
        const format = (document.format || '').toLowerCase();
        if (format === 'pdf') {
          contentType = 'application/pdf';
        } else if (format === 'png') {
          contentType = 'image/png';
        } else if (format === 'jpg' || format === 'jpeg') {
          contentType = 'image/jpeg';
        } else if (format === 'gif') {
          contentType = 'image/gif';
        } else {
          // Fallback: try to determine from resource type
          contentType = document.resourceType === 'image' ? 'image/jpeg' : 'application/pdf';
        }
      }
      
      const fileName = `${document.documentType.replace(/\s+/g, '_')}.${document.format || 'pdf'}`;
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.setHeader('Content-Length', fileResponse.data.length);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      // Send the buffer
      res.send(Buffer.from(fileResponse.data));
      
    } catch (cloudinaryError) {
      console.error('Cloudinary API error:', cloudinaryError);
      // If Admin API fails, inform user about the Cloudinary restriction
      throw new ApiError(500, "Unable to access document due to cloud storage restrictions. Please contact administrator to enable public delivery in Cloudinary settings.");
    }
    
  } catch (error) {
    console.error('Document download error:', error);
    return next(new ApiError(500, "Failed to download document from storage."));
  }
});

// === GET SIGNED URL: Generate a temporary signed URL for document access ===
router.get("/:id/signed-url", async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await Document.findOne({ _id: id, isDeleted: false })
      .populate("userId", "fullName email")
      .populate("issueId", "issueType");
    
    if (!document) {
      throw new ApiError(404, "Document not found.");
    }

    // Check access permissions (same logic as GET /:id)
    const isOwner = document.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    let hasAccessViaIssue = false;
    if (document.issueId && req.user.role === 'paralegal') {
      const Paralegal = (await import('../models/Paralegal.js')).default;
      const paralegalDoc = await Paralegal.findOne({ user: req.user._id });
      const LegalIssue = (await import('../models/LegalIssue.js')).default;
      const issue = await LegalIssue.findById(document.issueId);
      if (issue && paralegalDoc && issue.assignedParalegal?.toString() === paralegalDoc._id.toString()) {
        hasAccessViaIssue = true;
      }
    }

    if (!isOwner && !isAdmin && !hasAccessViaIssue) {
      throw new ApiError(403, "Access denied.");
    }

    // Return backend proxy URL instead of direct Cloudinary URL
    const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const proxyUrl = `${backendUrl}/api/documents/${id}/download`;
    
    return res.status(200).json(new ApiResponse(200, { 
      signedUrl: proxyUrl,
      documentType: document.documentType,
      format: document.format
    }, "Document access URL generated successfully."));
    
  } catch (error) {
    return next(error);
  }
});

// === DELETE: Soft delete a document ===
router.delete("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const document = await Document.findOneAndUpdate(
            { _id: id, userId: req.user._id, isDeleted: false },
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );
        if (!document) throw new ApiError(404, "Document not found or access denied.");
        return res.status(200).json(new ApiResponse(200, { id: document._id }, "Document deleted successfully."));
    } catch (error) {
        return next(error);
    }
});

export default router;