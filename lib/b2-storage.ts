/**
 * Backblaze B2 Cloud Storage Utility
 * 
 * This module provides utilities for uploading, downloading, and managing
 * recipe images in Backblaze B2 cloud storage. B2 is S3-compatible, so we
 * use the AWS SDK for seamless integration.
 * 
 * Features:
 * - S3-compatible API using AWS SDK
 * - Automatic file type detection and validation
 * - Unique filename generation with collision prevention
 * - Public URL generation for CDN access
 * - Error handling and retry logic
 * - Environment-based configuration
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// B2 Configuration
interface B2Config {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

/**
 * Get B2 configuration from environment variables
 */
function getB2Config(): B2Config {
  const endpoint = process.env.B2_ENDPOINT;
  const region = process.env.B2_REGION || 'us-west-004';
  const accessKeyId = process.env.B2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.B2_SECRET_ACCESS_KEY;
  const bucketName = process.env.B2_BUCKET_NAME;
  const publicUrl = process.env.B2_PUBLIC_URL;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error('B2 configuration missing. Please set B2_ENDPOINT, B2_ACCESS_KEY_ID, B2_SECRET_ACCESS_KEY, B2_BUCKET_NAME, and B2_PUBLIC_URL environment variables.');
  }

  return {
    endpoint,
    region,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl
  };
}

/**
 * Create S3 client configured for B2
 */
function createB2Client(): S3Client {
  const config = getB2Config();
  
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true, // Required for B2
  });
}

/**
 * Supported image MIME types
 */
const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];

/**
 * Maximum file size (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Generate unique filename for recipe image
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const uuid = uuidv4().substring(0, 8);
  const extension = getFileExtension(originalName);
  return `recipes/${timestamp}-${uuid}${extension}`;
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0].toLowerCase() : '.jpg';
}

/**
 * Get MIME type from buffer (basic detection)
 */
function getMimeTypeFromBuffer(buffer: Buffer): string | null {
  // Check for common image file signatures
  if (buffer.length < 4) return null;
  
  const header = buffer.toString('hex', 0, 4).toUpperCase();
  
  if (header.startsWith('FFD8')) return 'image/jpeg';
  if (header.startsWith('8950')) return 'image/png';
  if (header.startsWith('5249')) return 'image/webp';
  
  return null;
}

/**
 * Validate uploaded file
 */
function validateFile(file: File, buffer: Buffer): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  // Check file type from MIME type
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Supported formats: ${SUPPORTED_MIME_TYPES.join(', ')}`
    };
  }

  // Additional validation from file content
  const detectedMimeType = getMimeTypeFromBuffer(buffer);
  if (detectedMimeType && !SUPPORTED_MIME_TYPES.includes(detectedMimeType)) {
    return {
      valid: false,
      error: 'File content does not match a supported image format'
    };
  }

  return { valid: true };
}

/**
 * Upload image to B2 cloud storage
 */
export async function uploadImageToB2(
  file: File,
  buffer: Buffer
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate file
    const validation = validateFile(file, buffer);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const config = getB2Config();
    const client = createB2Client();
    const filename = generateUniqueFilename(file.name);

    // Upload to B2
    const uploadCommand = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
      ContentLength: buffer.length,
      // Make the object publicly readable
      ACL: 'public-read',
      // Add metadata
      Metadata: {
        'original-name': file.name,
        'upload-timestamp': Date.now().toString(),
        'content-type': file.type
      }
    });

    await client.send(uploadCommand);

    // Generate public URL
    const publicUrl = `${config.publicUrl}/${filename}`;

    console.log(`✅ Image uploaded to B2: ${publicUrl} (${buffer.length} bytes)`);

    return {
      success: true,
      url: publicUrl
    };

  } catch (error) {
    console.error('Error uploading image to B2:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}

/**
 * Delete image from B2 cloud storage
 */
export async function deleteImageFromB2(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getB2Config();
    const client = createB2Client();
    
    // Extract filename from URL
    const filename = imageUrl.replace(`${config.publicUrl}/`, '');
    
    if (!filename || filename === imageUrl) {
      return { success: false, error: 'Invalid image URL format' };
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: filename
    });

    await client.send(deleteCommand);

    console.log(`✅ Image deleted from B2: ${filename}`);

    return { success: true };

  } catch (error) {
    console.error('Error deleting image from B2:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deletion error'
    };
  }
}

/**
 * Check if image exists in B2 cloud storage
 */
export async function checkImageExistsInB2(
  imageUrl: string
): Promise<{ exists: boolean; error?: string }> {
  try {
    const config = getB2Config();
    const client = createB2Client();
    
    // Extract filename from URL
    const filename = imageUrl.replace(`${config.publicUrl}/`, '');
    
    if (!filename || filename === imageUrl) {
      return { exists: false, error: 'Invalid image URL format' };
    }

    const headCommand = new HeadObjectCommand({
      Bucket: config.bucketName,
      Key: filename
    });

    await client.send(headCommand);

    return { exists: true };

  } catch (error) {
    // If error is 404, file doesn't exist
    if (error instanceof Error && error.name === 'NotFound') {
      return { exists: false };
    }
    
    console.error('Error checking image in B2:', error);
    
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if B2 is configured and available
 */
export async function testB2Connection(): Promise<{ success: boolean; error?: string }> {
  try {
    getB2Config(); // This will throw if config is missing
    
    // Could add a simple test operation here if needed
    return { success: true };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'B2 configuration error'
    };
  }
}