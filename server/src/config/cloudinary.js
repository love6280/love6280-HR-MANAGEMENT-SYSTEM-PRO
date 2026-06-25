import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const uploadFileToStorage = async (file) => {
  // If file is just a path or multer object
  const filePath = file.path;
  
  if (isCloudinaryConfigured()) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'hrms',
        resource_type: 'auto',
      });
      // Delete local file after upload
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // Fallback to local if Cloudinary fails
    }
  }

  // Local fallback: return a relative URL that our Express server will serve static
  const filename = path.basename(filePath);
  const localUrl = `/uploads/${filename}`;
  return {
    url: localUrl,
    publicId: filename,
  };
};

export default cloudinary;
