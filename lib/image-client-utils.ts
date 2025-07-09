/**
 * Client-side Image Utilities
 * 
 * Helper functions for image handling that can be used in client components.
 * These functions don't import any Node.js modules.
 */

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
 * Validate if an image URL points to a local profile image
 * @param imageUrl - The image URL to validate
 * @returns boolean - True if it's a local profile image
 */
export function isLocalProfileImage(imageUrl: string): boolean {
  return imageUrl.startsWith('/images/profiles/') && 
         !imageUrl.startsWith('http://') && 
         !imageUrl.startsWith('https://');
}

/**
 * Check if URL is a B2 CDN URL
 */
export function isB2ImageUrl(url: string): boolean {
  // Check for typical B2 URL patterns
  return url.includes('backblazeb2.com') || url.includes('b2cdn.com');
}

/**
 * Get B2 public URL from environment (works on both client and server)
 */
function getB2PublicUrl(): string | null {
  if (typeof window !== 'undefined') {
    // Client-side: B2 URLs are set at build time, not runtime
    return process.env.NEXT_PUBLIC_B2_PUBLIC_URL || null;
  }
  // Server-side: Use the regular B2_PUBLIC_URL
  return process.env.B2_PUBLIC_URL || null;
}

/**
 * Transform local image URL to B2 CDN URL
 * 
 * Converts paths like '/images/recipes/recipe-123.jpg' 
 * to 'https://f005.backblazeb2.com/file/bucket/recipes/recipe-123.jpg'
 */
export function transformLocalToB2Url(localUrl: string): string | null {
  const b2PublicUrl = getB2PublicUrl();
  if (!b2PublicUrl) {
    return null;
  }

  // Handle recipe images
  if (isLocalRecipeImage(localUrl)) {
    // Extract the filename from local URL
    // '/images/recipes/recipe-123.jpg' -> 'recipe-123.jpg'
    const filename = localUrl.replace(/^\/images\/recipes\//, '');
    
    if (!filename) {
      return null;
    }

    // Construct B2 URL: B2_PUBLIC_URL/recipes/filename
    return `${b2PublicUrl}/recipes/${filename}`;
  }
  
  // Handle profile images
  if (isLocalProfileImage(localUrl)) {
    // Extract the filename from local URL
    // '/images/profiles/profile-123.jpg' -> 'profile-123.jpg'
    const filename = localUrl.replace(/^\/images\/profiles\//, '');
    
    if (!filename) {
      return null;
    }

    // Construct B2 URL: B2_PUBLIC_URL/profiles/filename
    return `${b2PublicUrl}/profiles/${filename}`;
  }
  
  return null;
}

/**
 * Get optimized image URL for recipe cards
 * 
 * This function handles the transition from local storage to B2:
 * 1. If URL is already a B2 URL, return as-is
 * 2. If URL is local, try to transform to B2 URL
 * 3. Return local URL as fallback
 * 4. Handle external URLs (Unsplash, etc.)
 */
export function getOptimizedImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) {
    return null;
  }

  // If it's already a B2 URL, use it directly
  if (isB2ImageUrl(imageUrl)) {
    return imageUrl;
  }

  // If it's a local URL, try to transform to B2
  if (isLocalRecipeImage(imageUrl)) {
    const b2Url = transformLocalToB2Url(imageUrl);
    if (b2Url) {
      return b2Url;
    }
    
    // If B2 transformation fails, return null to show placeholder
    return null;
  }

  // If it's an external URL (like Unsplash), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // For any other case, return null to show placeholder
  return null;
}

/**
 * Validate that an image URL is accessible (client-side only)
 */
export function validateImageUrl(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      // Server-side: assume valid
      resolve(true);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imageUrl;
    
    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000);
  });
}