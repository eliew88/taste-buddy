/**
 * Image Optimization Utilities
 * 
 * Server-side utilities for optimizing images for different use cases,
 * including Open Graph previews that work well with WhatsApp and other platforms.
 */

/**
 * Get optimized image URL for Open Graph metadata
 * 
 * WhatsApp and other platforms have issues with large images,
 * so we need to provide optimized versions for social sharing.
 * 
 * @param imageUrl - Original image URL
 * @returns Optimized image URL for Open Graph
 */
export function getOpenGraphImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) {
    return null;
  }

  // For now, return the original URL
  // TODO: Implement image optimization service that:
  // 1. Resizes images to max 1200x630 for Open Graph
  // 2. Compresses to under 1MB for WhatsApp compatibility
  // 3. Serves with proper cache headers
  // 
  // Options:
  // - Use Vercel Image Optimization API
  // - Use Cloudinary or similar service
  // - Implement custom image processing with Sharp
  
  return imageUrl;
}

/**
 * Check if an image URL is from B2/Backblaze
 */
export function isB2Url(url: string): boolean {
  return url.includes('backblazeb2.com') || url.includes('b2cdn.com');
}

/**
 * Get WhatsApp-friendly image URL
 * 
 * WhatsApp has specific requirements for preview images:
 * - Max file size: ~1MB works best
 * - Preferred dimensions: 1200x630 or similar aspect ratio
 * - Format: JPEG works most reliably
 */
export function getWhatsAppOptimizedImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) {
    return null;
  }

  // For B2 URLs, we might need special handling
  if (isB2Url(imageUrl)) {
    // TODO: Consider using an image proxy or optimization service
    // that can serve smaller versions of B2 images with better headers
    
    // For now, return original URL but log for monitoring
    console.log('WhatsApp Open Graph image from B2:', imageUrl);
  }

  return imageUrl;
}

/**
 * Suggested implementation approaches:
 * 
 * 1. Vercel Image Optimization (if on Vercel Pro):
 *    return `/_vercel/image?url=${encodeURIComponent(imageUrl)}&w=1200&q=75`;
 * 
 * 2. Cloudinary (free tier available):
 *    return `https://res.cloudinary.com/[your-cloud]/image/fetch/w_1200,h_630,c_fill,q_auto:good,f_auto/${imageUrl}`;
 * 
 * 3. Custom optimization endpoint:
 *    return `/api/og-image?url=${encodeURIComponent(imageUrl)}`;
 * 
 * 4. Pre-generate optimized versions during upload:
 *    - When uploading to B2, also create a smaller "og-" prefixed version
 *    - Store both URLs in database
 */