// Storage utility - supports local, S3, or Cloudinary

import path from 'path';
import fs from 'fs';

// Multer file type
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

export interface UploadedFile {
  url: string;
  filename: string;
}

/**
 * Upload file to storage (local, S3, or Cloudinary)
 * Returns the public URL of the uploaded file
 */
export async function uploadFile(
  file: MulterFile,
  folder: string = 'listings'
): Promise<UploadedFile> {
  // Cloudinary (recommended for production)
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return await uploadToCloudinary(file, folder);
  }

  // AWS S3
  if (process.env.AWS_S3_BUCKET) {
    return await uploadToS3(file, folder);
  }

  // Local storage (development/fallback)
  return await uploadLocal(file, folder);
}

async function uploadToCloudinary(
  file: MulterFile,
  folder: string
): Promise<UploadedFile> {
  // Dynamic import to avoid errors if cloudinary not installed
  let cloudinary: any;
  try {
    cloudinary = require('cloudinary').v2;
  } catch (error) {
    throw new Error('Cloudinary not installed. Run: npm install cloudinary');
  }
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `campuscycle/${folder}`,
        resource_type: 'image',
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
      },
      (error: any, result: any) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            filename: result.public_id,
          });
        }
      }
    );

    fs.createReadStream(file.path).pipe(uploadStream);
  });
}

async function uploadToS3(
  file: MulterFile,
  folder: string
): Promise<UploadedFile> {
  // Dynamic import to avoid errors if aws-sdk not installed
  let AWS: any;
  try {
    AWS = require('aws-sdk');
  } catch (error) {
    throw new Error('AWS SDK not installed. Run: npm install aws-sdk');
  }
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
  });

  const filename = `${folder}/${Date.now()}-${file.originalname}`;
  const fileContent = fs.readFileSync(file.path);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: filename,
    Body: fileContent,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };

  const result = await s3.upload(params).promise();

  // Clean up local file
  fs.unlinkSync(file.path);

  return {
    url: result.Location,
    filename: result.Key,
  };
}

async function uploadLocal(
  file: MulterFile,
  folder: string
): Promise<UploadedFile> {
  // For local storage, file is already saved by multer
  // Just return the URL path
  const filename = path.basename(file.path);
  const url = `/uploads/${filename}`;

  return {
    url,
    filename,
  };
}

/**
 * Delete file from storage
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  // If it's a cloud URL, delete from cloud storage
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    // Cloudinary
    if (fileUrl.includes('cloudinary.com')) {
      const cloudinary = require('cloudinary').v2;
      const publicId = fileUrl.match(/\/v\d+\/(.+)\.[^.]+$/)?.[1];
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }
    // S3 - extract key from URL and delete
    // Implementation depends on your S3 URL structure
    return;
  }

  // Local file
  const filePath = path.join(process.cwd(), fileUrl);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

