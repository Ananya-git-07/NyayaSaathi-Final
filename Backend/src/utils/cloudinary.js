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

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto", // Automatically detect the file type
            folder: "nyayasaathi_uploads" // Optional: organize uploads into a folder
        });

        // File has been uploaded successfully
        // console.log("File is uploaded on Cloudinary: ", response.url);
        
        // Unlink the locally saved temporary file
        fs.unlinkSync(localFilePath);
        
        return response;

    } catch (error) {
        // If the upload operation failed, remove the locally saved temporary file
        fs.unlinkSync(localFilePath); 
        console.error("Cloudinary upload failed:", error);
        return null;
    }
}

export { uploadOnCloudinary };