/**
 * Recipe Image Upload API with B2 Cloud Storage
 * 
 * Handles file uploads for recipe images with validation and cloud storage.
 * 
 * Features:
 * - File type validation (JPEG, PNG, WebP)
 * - File size validation (max 5MB)
 * - Unique filename generation
 * - B2 cloud storage with local fallback
 * - CDN URL generation
 * - Error handling and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getCurrentUserId } from '@/lib/auth';
import { uploadImageToB2, testB2Connection } from '@/lib/b2-storage';

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'recipes');

/**
 * Generate unique filename with timestamp and random string
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName).toLowerCase();
  return `recipe-${timestamp}-${randomString}${extension}`;
}

/**
 * Validate uploaded file
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
    };
  }

  // Check file name
  if (!file.name || file.name.trim() === '') {
    return {
      valid: false,
      error: 'File name is required'
    };
  }

  return { valid: true };
}

/**
 * Ensure upload directory exists
 */
async function ensureUploadDirectory(): Promise<void> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid form data' },
        { status: 400 }
      );
    }

    // Get the uploaded file
    const file = formData.get('image') as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate the file (basic validation before processing)
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Try B2 upload first
    console.log('🔄 Attempting B2 upload...');
    const b2Result = await uploadImageToB2(file, buffer);
    
    if (b2Result.success && b2Result.url) {
      console.log(`✅ Image uploaded to B2: ${b2Result.url} (${file.size} bytes)`);
      
      return NextResponse.json({
        success: true,
        data: {
          filename: b2Result.url.split('/').pop() || 'unknown',
          url: b2Result.url,
          size: file.size,
          type: file.type,
          originalName: file.name,
          storage: 'b2'
        }
      });
    }

    // Fallback to local storage if B2 fails
    console.log('⚠️ B2 upload failed, falling back to local storage...');
    console.log('B2 Error:', b2Result.error);

    // Ensure upload directory exists
    await ensureUploadDirectory();

    // Generate unique filename for local storage
    const uniqueFilename = generateUniqueFilename(file.name);
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);
    const publicUrl = `/images/recipes/${uniqueFilename}`;
    
    await writeFile(filePath, buffer);

    console.log(`✅ Image uploaded locally: ${publicUrl} (${file.size} bytes)`);

    return NextResponse.json({
      success: true,
      data: {
        filename: uniqueFilename,
        url: publicUrl,
        size: file.size,
        type: file.type,
        originalName: file.name,
        storage: 'local'
      }
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}