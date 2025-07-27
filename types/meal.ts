/**
 * Type definitions for the TasteBuddy meal system
 * 
 * This file contains all TypeScript interfaces and types related to meals,
 * which are simplified posts for meal memories without complex recipe details.
 */

/**
 * MealImage interface - represents an image associated with a meal
 */
export interface MealImage {
  /** Unique identifier for the image */
  id: string;
  
  /** Image URL (from B2 or local storage) */
  url: string;
  
  /** Original filename */
  filename?: string;
  
  /** Optional caption for the image */
  caption?: string;
  
  /** Alt text for accessibility */
  alt?: string;
  
  /** Image width in pixels */
  width?: number;
  
  /** Image height in pixels */
  height?: number;
  
  /** File size in bytes */
  fileSize?: number;
  
  /** Display order (0 = first) */
  displayOrder: number;
  
  /** Whether this is the primary image for meal cards */
  isPrimary: boolean;
  
  /** ID of the meal this image belongs to */
  mealId: string;
  
  /** When the image was uploaded */
  createdAt: Date;
  
  /** When the image was last updated */
  updatedAt: Date;
}

/**
 * Data structure for creating a new meal image
 */
export interface CreateMealImageData {
  url: string;
  filename?: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  displayOrder: number;
  isPrimary?: boolean;
  file?: File; // For new uploads that haven't been sent to B2 yet
}

/**
 * Data structure for updating an existing meal image
 */
export interface UpdateMealImageData {
  caption?: string;
  alt?: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

/**
 * Main Meal interface - represents a meal memory post with photos and description
 */
export interface Meal {
  /** Unique identifier for the meal */
  id: string;
  
  /** Meal name/title */
  name: string;
  
  /** Optional description of the meal */
  description?: string;
  
  /** Optional date when the meal was made */
  date?: Date;
  
  /** Array of meal images (up to 5) */
  images?: MealImage[];
  
  /** ID of the user who created this meal */
  authorId: string;
  
  /** Author information (populated from User table) */
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  
  /** When the meal was created */
  createdAt: Date;
  
  /** When the meal was last updated */
  updatedAt: Date;
}

/**
 * Data structure for creating a new meal
 * Excludes auto-generated fields like ID, timestamps, and author info
 */
export interface CreateMealData {
  name: string;
  description?: string;
  date?: Date;
  images?: CreateMealImageData[]; // Up to 5 images
}

/**
 * Data structure for updating an existing meal
 * All fields are optional to allow partial updates
 */
export interface UpdateMealData {
  name?: string;
  description?: string;
  date?: Date;
  images?: CreateMealImageData[];
}

/**
 * Meal list response interface for API endpoints
 */
export interface MealListResponse {
  meals: Meal[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Search/filter options for meals
 */
export interface MealFilters {
  /** Text search query (searches name and description) */
  search?: string;
  
  /** Filter by date range */
  dateFrom?: Date;
  dateTo?: Date;
  
  /** Pagination */
  page?: number;
  limit?: number;
}