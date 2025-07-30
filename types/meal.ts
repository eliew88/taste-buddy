/**
 * Type definitions for the TasteBuddy meal memory system
 * 
 * This file contains all TypeScript interfaces and types related to meal memories,
 * which are posts about meals with photos, descriptions, and tagged TasteBuddies.
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
 * MealTag interface - represents a user tagged in a meal memory
 */
export interface MealTag {
  /** Unique identifier for the tag */
  id: string;
  
  /** ID of the meal */
  mealId: string;
  
  /** ID of the tagged user */
  userId: string;
  
  /** When the user was tagged */
  taggedAt: Date;
  
  /** ID of the user who created the tag */
  taggedBy: string;
  
  /** Tagged user information (populated from User table) */
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

/**
 * Main Meal interface - represents a meal memory post with photos, description, and tagged users
 */
export interface Meal {
  /** Unique identifier for the meal memory */
  id: string;
  
  /** Meal memory name/title */
  name: string;
  
  /** Optional description of the meal memory */
  description?: string;
  
  /** Optional date when the meal was made */
  date?: Date;
  
  /** Whether this meal memory is public (true) or private (false) */
  isPublic: boolean;
  
  /** Array of meal images (up to 5) */
  images?: MealImage[];
  
  /** Array of tagged users (TasteBuddies) */
  taggedUsers?: MealTag[];
  
  /** ID of the user who created this meal memory */
  authorId: string;
  
  /** Author information (populated from User table) */
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  
  /** When the meal memory was created */
  createdAt: Date;
  
  /** When the meal memory was last updated */
  updatedAt: Date;
}

/**
 * Data structure for creating a new meal memory
 * Excludes auto-generated fields like ID, timestamps, and author info
 */
export interface CreateMealData {
  name: string;
  description?: string;
  date?: Date;
  isPublic?: boolean; // Defaults to true if not specified
  images?: CreateMealImageData[]; // Up to 5 images
  taggedUserIds?: string[]; // IDs of TasteBuddies to tag
}

/**
 * Data structure for updating an existing meal memory
 * All fields are optional to allow partial updates
 */
export interface UpdateMealData {
  name?: string;
  description?: string;
  date?: Date;
  isPublic?: boolean;
  images?: CreateMealImageData[];
  taggedUserIds?: string[]; // IDs of TasteBuddies to tag
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
  
  /** Filter by meal type - meals created by user, tagged in, or both */
  mealType?: 'created' | 'tagged' | 'all';
  
  /** Pagination */
  page?: number;
  limit?: number;
}