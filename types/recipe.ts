/**
 * Type definitions for the TasteBuddy recipe system
 * 
 * This file contains all TypeScript interfaces and types related to recipes,
 * users, and other core entities in the application.
 */

/**
 * Main Recipe interface - represents a complete recipe with all metadata
 */
 export interface Recipe {
    /** Unique identifier for the recipe */
    id: string;
    
    /** Recipe title/name */
    title: string;
    
    /** Optional description of the recipe */
    description?: string;
    
    /** Array of ingredient strings (e.g., "2 cups flour") */
    ingredients: string[];
    
    /** Step-by-step cooking instructions */
    instructions: string;
    
    /** Estimated cooking time (e.g., "30 mins", "1h 15m") */
    cookTime?: string;
    
    /** Number of servings this recipe makes */
    servings?: number;
    
    /** Difficulty level: easy, medium, or hard */
    difficulty: 'easy' | 'medium' | 'hard';
    
    /** Array of tags for categorization (e.g., ["dessert", "chocolate"]) */
    tags: string[];
    
    /** URL to recipe image (optional) */
    image?: string;
    
    /** ID of the user who created this recipe */
    authorId: string;
    
    /** Author information (populated from User table) */
    author: {
      id: string;
      name: string;
      email: string;
    };
    
    /** When the recipe was created */
    createdAt: Date;
    
    /** When the recipe was last updated */
    updatedAt: Date;
    
    /** Counts from related tables (optional, populated by Prisma) */
    _count?: {
      favorites: number;
      ratings: number;
      comments: number;
    };
    
    /** Calculated average rating (computed from ratings) */
    avgRating?: number;
  }
  
  /**
   * Data structure for creating a new recipe
   * Excludes auto-generated fields like ID, timestamps, and author info
   */
  export interface CreateRecipeData {
    title: string;
    description?: string;
    ingredients: string[];
    instructions: string;
    cookTime?: string;
    servings?: number;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    image?: string;
  }

  /**
   * Data structure for updating an existing recipe
   * All fields are optional to allow partial updates
   */
  export interface UpdateRecipeData {
    title?: string;
    description?: string;
    ingredients?: string[];
    instructions?: string;
    cookTime?: string;
    servings?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    tags?: string[];
    image?: string;
  }
  
  /**
   * User interface - represents a registered user
   */
  export interface User {
    /** Unique user identifier */
    id: string;
    
    /** User's email address (unique) */
    email: string;
    
    /** User's display name (optional) */
    name?: string;
    
    /** URL to user's profile image (optional) */
    image?: string;
    
    /** When the user account was created */
    createdAt: Date;
    
    /** When the user account was last updated */
    updatedAt: Date;
  }
  
  /**
   * Search filters interface for recipe searching
   */
  export interface SearchFilters {
    /** Text search query */
    search: string;
    
    /** Array of required ingredients */
    ingredients: string[];
    
    /** Difficulty filter */
    difficulty: string;
    
    /** Array of required tags */
    tags: string[];
  }

  /**
   * Comment interface - represents a user comment on a recipe
   */
  export interface Comment {
    /** Unique identifier for the comment */
    id: string;
    
    /** The comment content */
    content: string;
    
    /** Who can see this comment */
    visibility: 'private' | 'author_only' | 'public';
    
    /** When the comment was created */
    createdAt: Date;
    
    /** When the comment was last updated */
    updatedAt: Date;
    
    /** ID of the user who wrote this comment */
    userId: string;
    
    /** ID of the recipe this comment is on */
    recipeId: string;
    
    /** Author information (populated from User table) */
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }

  /**
   * Data structure for creating a new comment
   */
  export interface CreateCommentData {
    content: string;
    visibility: 'private' | 'author_only' | 'public';
    recipeId: string;
  }

  /**
   * Data structure for updating an existing comment
   */
  export interface UpdateCommentData {
    content?: string;
    visibility?: 'private' | 'author_only' | 'public';
  }