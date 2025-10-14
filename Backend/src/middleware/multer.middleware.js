import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create absolute path to temp directory
const uploadPath = path.join(__dirname, "..", "public", "temp");

// Ensure directory exists - create if missing
const ensureUploadDirectory = () => {
  try {
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`✅ Created upload directory: ${uploadPath}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to create upload directory: ${error.message}`);
    return false;
  }
};

// Initialize directory on startup
ensureUploadDirectory();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Double-check directory exists before each upload
    if (!ensureUploadDirectory()) {
      return cb(new Error("Upload directory is not available"));
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename to avoid conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExtension);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize filename
    cb(null, `${sanitizedBaseName}-${uniqueSuffix}${fileExtension}`);
  }
});

// File filtering for security
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    const error = new Error('Only images (JPEG, JPG, PNG, GIF), PDFs, and documents (DOC, DOCX, TXT) are allowed!');
    error.code = 'INVALID_FILE_TYPE';
    cb(error);
  }
};

// Create multer instance with configuration
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only one file at a time
  },
  fileFilter: fileFilter
});

// Export a cleanup function to remove temporary files
export const cleanupTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Cleaned up temp file: ${path.basename(filePath)}`);
    } catch (error) {
      console.error(`❌ Failed to cleanup temp file: ${error.message}`);
    }
  }
};

// Export utility function to get upload path
export const getUploadPath = () => uploadPath;

// Export function to check if upload directory is ready
export const isUploadReady = () => {
  return fs.existsSync(uploadPath) && fs.statSync(uploadPath).isDirectory();
};