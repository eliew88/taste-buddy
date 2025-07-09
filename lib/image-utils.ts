/**
 * Image Utilities
 * 
 * Helper functions for managing recipe images including cleanup and validation.
 */

import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'recipes');

/**
 * Delete an image file from the filesystem
 * @param imageUrl - The public URL of the image (e.g., "/images/recipes/recipe-123.jpg")
 * @returns Promise<boolean> - True if deleted successfully, false otherwise
 */
export async function deleteRecipeImage(imageUrl: string): Promise<boolean> {
  try {
    // Skip deletion for external URLs (http/https)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('⏭️ Skipping deletion of external image:', imageUrl);
      return true;
    }

    // Extract filename from URL
    const filename = path.basename(imageUrl);
    const filePath = path.join(UPLOAD_DIR, filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      console.log('⚠️ Image file not found:', filePath);
      return false;
    }

    // Delete the file
    await unlink(filePath);
    console.log('🗑️ Deleted image:', filePath);
    return true;

  } catch (error) {
    console.error('❌ Error deleting image:', imageUrl, error);
    return false;
  }
}

/**
 * Validate if an image URL points to a local recipe image
 * @param imageUrl - The image URL to validate
 * @returns boolean - True if it's a local recipe image
 */
export function isLocalRecipeImage(imageUrl: string): boolean {
  return imageUrl.startsWith('/images/recipes/') && 
         !imageUrl.startsWith('http://') && 
         !imageUrl.startsWith('https://');
}

/**
 * Get the absolute file path from a public image URL
 * @param imageUrl - The public URL (e.g., "/images/recipes/recipe-123.jpg")
 * @returns string - The absolute file path
 */
export function getImageFilePath(imageUrl: string): string {
  const filename = path.basename(imageUrl);
  return path.join(UPLOAD_DIR, filename);
}

/**
 * Check if an image file exists on the filesystem
 * @param imageUrl - The public URL of the image
 * @returns boolean - True if file exists
 */
export function imageFileExists(imageUrl: string): boolean {
  if (!isLocalRecipeImage(imageUrl)) {
    return true; // Assume external images exist
  }
  
  const filePath = getImageFilePath(imageUrl);
  return existsSync(filePath);
}

/**
 * Get image file size in bytes
 * @param imageUrl - The public URL of the image
 * @returns Promise<number> - File size in bytes, or 0 if not found
 */
export async function getImageFileSize(imageUrl: string): Promise<number> {
  try {
    if (!isLocalRecipeImage(imageUrl)) {
      return 0; // Cannot determine size of external images
    }

    const filePath = getImageFilePath(imageUrl);
    if (!existsSync(filePath)) {
      return 0;
    }

    const fs = await import('fs/promises');
    const stats = await fs.stat(filePath);
    return stats.size;

  } catch (error) {
    console.error('Error getting image file size:', error);
    return 0;
  }
}

/**
 * Clean up orphaned image files (images not referenced by any recipe)
 * @param referencedImages - Array of image URLs currently in use
 * @returns Promise<number> - Number of files cleaned up
 */
export async function cleanupOrphanedImages(referencedImages: string[]): Promise<number> {
  try {
    const fs = await import('fs/promises');
    
    if (!existsSync(UPLOAD_DIR)) {
      return 0;
    }

    const files = await fs.readdir(UPLOAD_DIR);
    const referencedFilenames = referencedImages
      .filter(isLocalRecipeImage)
      .map(url => path.basename(url));

    let cleanedCount = 0;

    for (const file of files) {
      // Skip non-image files and system files
      if (!file.match(/\.(jpg|jpeg|png|webp)$/i) || file.startsWith('.')) {
        continue;
      }

      // Skip files that are still referenced
      if (referencedFilenames.includes(file)) {
        continue;
      }

      // Delete orphaned file
      const filePath = path.join(UPLOAD_DIR, file);
      try {
        await fs.unlink(filePath);
        console.log('🧹 Cleaned up orphaned image:', file);
        cleanedCount++;
      } catch (error) {
        console.error('Error deleting orphaned image:', file, error);
      }
    }

    if (cleanedCount > 0) {
      console.log(`✅ Cleaned up ${cleanedCount} orphaned images`);
    }

    return cleanedCount;

  } catch (error) {
    console.error('Error during image cleanup:', error);
    return 0;
  }
}