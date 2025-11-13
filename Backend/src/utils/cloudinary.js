// PASTE THIS ENTIRE FILE INTO Backend/src/utils/cloudinary.js

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary with your credentials from the .env file
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "nyayasaathi_uploads"
        });
        
        fs.unlinkSync(localFilePath);
        
        return response;

    } catch (error) {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); 
        }
        console.error("Cloudinary upload failed:", error);
        return null;
    }
}

// --- THIS IS THE FIX: Add function to delete assets ---
const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return null;
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Deleted old asset from Cloudinary:", result);
        return result;
    } catch (error) {
        console.error("Cloudinary deletion failed:", error);
        return null;
    }
};
// --- END OF FIX ---


export { uploadOnCloudinary, deleteFromCloudinary };