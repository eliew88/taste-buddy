/**
 * Daily content selection utilities for TasteBuddy
 * 
 * Provides deterministic content selection based on the current date
 * to prevent hydration mismatches while still providing variety.
 */

/**
 * Creates a simple hash from a string
 * @param str - String to hash
 * @returns Hash number
 */
function createSimpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Gets the current hour as a string for consistent hashing
 * @returns Hour string in YYYY-MM-DD-HH format
 */
function getCurrentHourString(): string {
  const now = new Date();
  return `${now.toISOString().split('T')[0]}-${now.getHours().toString().padStart(2, '0')}`;
}

/**
 * Selects an hourly image from the provided images array
 * Uses hour-based hashing to ensure server/client consistency
 * Image changes every hour instead of every day
 * @param images - Array of image URLs to choose from
 * @returns Selected image URL or null if no images provided
 */
export function getDailyImage(images: string[]): string | null {
  if (!images || images.length === 0) {
    return null;
  }
  
  // Use hour + "image" to create a different hash than quotes
  const currentHour = getCurrentHourString();
  const hashInput = `${currentHour}-image`;
  const hash = createSimpleHash(hashInput);
  
  // Use hash to select image deterministically
  const index = hash % images.length;
  return images[index];
}

/**
 * Gets both hourly quote and hourly image for the hero section
 * This ensures consistent content across server and client renders
 * Content changes every hour instead of every day
 * @param images - Array of hero images to choose from
 * @returns Object with both quote and image data
 */
export function getDailyHeroContent(images: string[]): {
  image: string | null;
  quote: { text: string; author: string };
} {
  // Import here to avoid circular dependencies
  const { getDailyQuoteForDisplay } = require('./quotes');
  
  return {
    image: getDailyImage(images),
    quote: getDailyQuoteForDisplay()
  };
}