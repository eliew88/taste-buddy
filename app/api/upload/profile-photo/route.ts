/**
 * Profile Photo Upload API with B2 Cloud Storage
 * 
 * Handles profile photo uploads with validation, cloud storage, and database updates.
 * 
 * Features:
 * - File type validation (JPEG, PNG, WebP)
 * - File size validation (max 2MB for profile photos)
 * - Unique filename generation
 * - B2 cloud storage with local fallback
 * - Database update to store image URL
 * - CDN URL generation
 * - Error handling and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getCurrentUserId } from '@/lib/auth';
import { uploadImageToB2 } from '@/lib/b2-storage';
import { prisma } from '@/lib/db';

// Configuration
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB (smaller than recipe images)
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'profiles');

/**
 * Generate unique filename for profile photo
 */
function generateUniqueFilename(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const extension = path.extname(originalName).toLowerCase();
  return `profile-${userId}-${timestamp}${extension}`;
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

/**
 * Update user profile photo in database
 */
async function updateUserProfilePhoto(userId: string, imageUrl: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { image: imageUrl }
  });
}

export async function POST(request: NextRequest) {
  const uploadLog: any = {
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    // Step 1: Check authentication
    uploadLog.steps.push({ step: 'auth_check', status: 'starting' });
    const userId = await getCurrentUserId();
    if (!userId) {
      uploadLog.steps.push({ step: 'auth_check', status: 'failed', error: 'No user ID' });
      console.error('❌ Profile photo upload failed - Authentication required', uploadLog);
      return NextResponse.json(
        { success: false, error: 'Authentication required', debug: uploadLog },
        { status: 401 }
      );
    }
    uploadLog.steps.push({ step: 'auth_check', status: 'success', userId });

    // Step 2: Parse form data
    uploadLog.steps.push({ step: 'form_parse', status: 'starting' });
    let formData: FormData;
    try {
      formData = await request.formData();
      uploadLog.steps.push({ step: 'form_parse', status: 'success' });
    } catch (error) {
      uploadLog.steps.push({ step: 'form_parse', status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('❌ Profile photo upload failed - Invalid form data', uploadLog);
      return NextResponse.json(
        { success: false, error: 'Invalid form data', debug: uploadLog },
        { status: 400 }
      );
    }

    // Step 3: Get the uploaded file
    uploadLog.steps.push({ step: 'file_extract', status: 'starting' });
    const file = formData.get('photo') as File | null;
    if (!file) {
      uploadLog.steps.push({ step: 'file_extract', status: 'failed', error: 'No file in form data' });
      console.error('❌ Profile photo upload failed - No photo file provided', uploadLog);
      return NextResponse.json(
        { success: false, error: 'No photo file provided', debug: uploadLog },
        { status: 400 }
      );
    }
    uploadLog.steps.push({ 
      step: 'file_extract', 
      status: 'success', 
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    });

    // Step 4: Validate the file
    uploadLog.steps.push({ step: 'file_validation', status: 'starting' });
    const validation = validateFile(file);
    if (!validation.valid) {
      uploadLog.steps.push({ step: 'file_validation', status: 'failed', error: validation.error });
      console.error('❌ Profile photo upload failed - File validation failed', uploadLog);
      return NextResponse.json(
        { success: false, error: validation.error, debug: uploadLog },
        { status: 400 }
      );
    }
    uploadLog.steps.push({ step: 'file_validation', status: 'success' });

    // Step 5: Convert file to buffer
    uploadLog.steps.push({ step: 'buffer_conversion', status: 'starting' });
    let buffer: Buffer;
    try {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      uploadLog.steps.push({ step: 'buffer_conversion', status: 'success', bufferSize: buffer.length });
    } catch (error) {
      uploadLog.steps.push({ step: 'buffer_conversion', status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('❌ Profile photo upload failed - Buffer conversion failed', uploadLog);
      return NextResponse.json(
        { success: false, error: 'Failed to process file', debug: uploadLog },
        { status: 500 }
      );
    }

    // Step 6: Try B2 upload first
    uploadLog.steps.push({ step: 'b2_upload', status: 'starting' });
    console.log('🔄 Attempting B2 upload for profile photo...');
    
    // Create a new file object with profile-specific naming
    const profileFile = new File([buffer], generateUniqueFilename(file.name, userId), { type: file.type });
    const b2Result = await uploadImageToB2(profileFile, buffer, 'profiles');
    
    let finalImageUrl: string;
    let storage: string;
    
    if (b2Result.success && b2Result.url) {
      uploadLog.steps.push({ step: 'b2_upload', status: 'success', url: b2Result.url });
      console.log(`✅ Profile photo uploaded to B2: ${b2Result.url} (${file.size} bytes)`);
      finalImageUrl = b2Result.url;
      storage = 'b2';
    } else {
      // Step 7: B2 failed, try local fallback
      uploadLog.steps.push({ step: 'b2_upload', status: 'failed', error: b2Result.error });
      uploadLog.steps.push({ step: 'local_fallback', status: 'starting' });
      console.log('⚠️ B2 upload failed, falling back to local storage...');
      console.log('B2 Error:', b2Result.error);

      // Ensure upload directory exists
      await ensureUploadDirectory();

      // Generate unique filename for local storage
      const uniqueFilename = generateUniqueFilename(file.name, userId);
      const filePath = path.join(UPLOAD_DIR, uniqueFilename);
      const publicUrl = `/images/profiles/${uniqueFilename}`;
      
      await writeFile(filePath, buffer);
      uploadLog.steps.push({ step: 'local_fallback', status: 'success', url: publicUrl });
      
      console.log(`✅ Profile photo uploaded locally: ${publicUrl} (${file.size} bytes)`);
      finalImageUrl = publicUrl;
      storage = 'local';
    }

    // Step 8: Update user profile in database
    uploadLog.steps.push({ step: 'db_update', status: 'starting' });
    try {
      await updateUserProfilePhoto(userId, finalImageUrl);
      uploadLog.steps.push({ step: 'db_update', status: 'success' });
      console.log(`✅ User profile updated with new photo: ${finalImageUrl}`);
    } catch (error) {
      uploadLog.steps.push({ step: 'db_update', status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('❌ Failed to update user profile in database', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile', debug: uploadLog },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        filename: finalImageUrl.split('/').pop() || 'unknown',
        url: finalImageUrl,
        size: file.size,
        type: file.type,
        originalName: file.name,
        storage
      },
      debug: uploadLog
    });

  } catch (error) {
    uploadLog.steps.push({ step: 'unexpected_error', status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
    console.error('❌ Profile photo upload failed - Unexpected error:', error);
    console.error('Upload log:', uploadLog);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload profile photo',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: uploadLog
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