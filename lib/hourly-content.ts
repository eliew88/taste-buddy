/**
 * Hourly content selection utilities for TasteBuddy
 * 
 * Provides deterministic content selection based on the current hour
 * to prevent hydration mismatches while still providing variety.
 */

import { getHourlyQuoteForDisplay } from './quotes';

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

// Default fallback images for when no other images are available
const DEFAULT_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1980&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2181&q=80',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1965&q=80'
];

/**
 * Selects an hourly image from the provided images array
 * Uses hour-based hashing to ensure server/client consistency
 * Image changes every hour
 * @param images - Array of image URLs to choose from
 * @returns Selected image URL, never null (uses fallback if needed)
 */
export function getHourlyImage(images: string[]): string {
  // Use fallback images if no images provided
  const imageArray = (!images || images.length === 0) ? DEFAULT_FALLBACK_IMAGES : images;
  
  // Use hour + "image" to create a different hash than quotes
  const currentHour = getCurrentHourString();
  const hashInput = `${currentHour}-image`;
  const hash = createSimpleHash(hashInput);
  
  // Use hash to select image deterministically
  const index = hash % imageArray.length;
  return imageArray[index];
}

/**
 * Gets both hourly quote and hourly image for the hero section
 * This ensures consistent content across server and client renders
 * Content changes every hour
 * @param images - Array of hero images to choose from
 * @returns Object with both quote and image data
 */
export function getHourlyHeroContent(images: string[]): {
  image: string;
  quote: { text: string; author: string };
} {
  return {
    image: getHourlyImage(images),
    quote: getHourlyQuoteForDisplay()
  };
}

// Backward compatibility exports
export const getDailyImage = getHourlyImage;
export const getDailyHeroContent = getHourlyHeroContent;