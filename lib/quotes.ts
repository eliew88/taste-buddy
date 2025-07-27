/**
 * Quote utility functions for TasteBuddy
 * 
 * Provides functions to select and format food quotes for display
 * in the application's hero section.
 */

import { foodQuotes, type FoodQuote } from '@/data/food-quotes';

/**
 * Selects a random quote from the food quotes collection
 * @returns A randomly selected FoodQuote object
 */
export function getRandomFoodQuote(): FoodQuote {
  if (foodQuotes.length === 0) {
    // Fallback quote if the quotes array is empty
    return {
      text: "Discover, cook, and share amazing recipes!",
      author: "TasteBuddy"
    };
  }
  
  const randomIndex = Math.floor(Math.random() * foodQuotes.length);
  return foodQuotes[randomIndex];
}

/**
 * Formats a quote for display with proper attribution
 * @param quote - The FoodQuote to format
 * @param includeAuthor - Whether to include the author in the formatted string
 * @returns Formatted quote string
 */
export function formatQuote(quote: FoodQuote, includeAuthor: boolean = true): string {
  if (includeAuthor && quote.author && quote.author !== 'Unknown') {
    return `"${quote.text}" — ${quote.author}`;
  }
  return quote.text;
}

/**
 * Gets a random formatted quote ready for display
 * @param includeAuthor - Whether to include the author attribution
 * @returns A formatted quote string ready for display
 */
export function getRandomFormattedQuote(includeAuthor: boolean = false): string {
  const quote = getRandomFoodQuote();
  return formatQuote(quote, includeAuthor);
}

/**
 * Gets a deterministic "random" quote based on the current hour
 * This ensures server and client render the same quote (no hydration mismatch)
 * Quote changes every hour instead of every day
 * @returns Object with formatted quote text and author
 */
export function getDailyQuoteForDisplay(): { text: string; author: string } {
  // Get current date and hour as a string (YYYY-MM-DD-HH)
  const now = new Date();
  const hourKey = `${now.toISOString().split('T')[0]}-${now.getHours().toString().padStart(2, '0')}`;
  
  // Create a simple hash from the hour key string
  let hash = 0;
  for (let i = 0; i < hourKey.length; i++) {
    const char = hourKey.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use the hash to select a quote deterministically
  const index = Math.abs(hash) % foodQuotes.length;
  const quote = foodQuotes[index];
  
  return {
    text: `"${quote.text}"`,
    author: quote.author
  };
}

/**
 * Gets a random quote with formatted text (always in quotes) and separate author
 * @returns Object with formatted quote text and author
 */
export function getRandomQuoteForDisplay(): { text: string; author: string } {
  const quote = getRandomFoodQuote();
  return {
    text: `"${quote.text}"`,
    author: quote.author
  };
}

/**
 * Gets all available quotes (useful for testing or admin purposes)
 * @returns Array of all FoodQuote objects
 */
export function getAllQuotes(): FoodQuote[] {
  return [...foodQuotes];
}

/**
 * Gets the total number of available quotes
 * @returns Number of quotes in the collection
 */
export function getQuoteCount(): number {
  return foodQuotes.length;
}