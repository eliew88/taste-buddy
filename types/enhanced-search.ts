/**
 * Enhanced Search Types for FoodFeed
 * 
 * Comprehensive type definitions for advanced search functionality
 * including filtering, sorting, and pagination capabilities.
 * 
 * @file types/enhanced-search.ts
 */

/**
 * Sort options for recipe search results
 */
export type SortOption = 
  | 'newest'        // createdAt DESC
  | 'oldest'        // createdAt ASC
  | 'popular'       // favorites count DESC
  | 'rating'        // avgRating DESC
  | 'title'         // title ASC
  | 'cookTime'      // cookTime ASC
  | 'difficulty';   // difficulty ASC (easy, medium, hard)

/**
 * View mode for displaying search results
 */
export type ViewMode = 'grid' | 'list';

/**
 * Enhanced search parameters for advanced filtering
 */
export interface EnhancedSearchParams {
  /** Text search query across title, description, ingredients */
  query?: string;
  
  /** Filter by difficulty levels (multiple selection) */
  difficulty?: string[];
  
  /** Filter by specific ingredients (must contain all) */
  ingredients?: string[];
  
  /** Filter by tags (multiple selection) */
  tags?: string[];
  
  /** Filter by cook time range (in minutes) */
  cookTimeMin?: number;
  cookTimeMax?: number;
  
  /** Filter by serving size range */
  servingsMin?: number;
  servingsMax?: number;
  
  /** Filter by minimum rating */
  minRating?: number;
  
  /** Filter by specific author */
  authorId?: string;
  
  /** Date range filtering */
  createdAfter?: string;   // ISO date string
  createdBefore?: string;  // ISO date string
  
  /** Sorting option */
  sortBy?: SortOption;
  
  /** Pagination */
  page?: number;
  limit?: number;
  
  /** View preferences */
  viewMode?: ViewMode;
}

/**
 * Filter state for the search interface
 */
export interface SearchFilters {
  difficulty: string[];
  ingredients: string[];
  tags: string[];
  cookTimeRange: [number, number];
  servingsRange: [number, number];
  minRating: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

/**
 * Search result metadata with enhanced statistics
 */
export interface SearchResultMeta {
  /** Total number of recipes matching the search criteria */
  totalResults: number;
  
  /** Current page number */
  currentPage: number;
  
  /** Total number of pages */
  totalPages: number;
  
  /** Number of results per page */
  resultsPerPage: number;
  
  /** Whether there are more results after current page */
  hasNextPage: boolean;
  
  /** Whether there are results before current page */
  hasPreviousPage: boolean;
  
  /** Search execution time in milliseconds */
  searchTime: number;
  
  /** Applied filters summary */
  appliedFilters: {
    count: number;
    summary: string[];
  };
  
  /** Suggested improvements for empty results */
  suggestions?: string[];
}

/**
 * Enhanced API response for search results
 */
export interface EnhancedSearchResponse {
  success: boolean;
  data: Recipe[];
  meta: SearchResultMeta;
  error?: string;
}

/**
 * Popular search suggestions and autocompletion
 */
export interface SearchSuggestions {
  /** Popular search terms */
  popularQueries: string[];
  
  /** Trending ingredients */
  trendingIngredients: string[];
  
  /** Popular tags */
  popularTags: string[];
  
  /** Recent searches (if user authentication available) */
  recentSearches?: string[];
}

/**
 * Filter options metadata from the database
 */
export interface FilterOptions {
  /** Available difficulty levels with counts */
  difficulties: Array<{
    value: string;
    label: string;
    count: number;
  }>;
  
  /** Popular ingredients with usage counts */
  popularIngredients: Array<{
    name: string;
    count: number;
  }>;
  
  /** Available tags with counts */
  tags: Array<{
    name: string;
    count: number;
  }>;
  
  /** Cook time statistics */
  cookTimeStats: {
    min: number;
    max: number;
    average: number;
  };
  
  /** Servings statistics */
  servingsStats: {
    min: number;
    max: number;
    average: number;
  };
}

/**
 * Recipe interface extension for search results
 */
export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string;
  cookTime?: string;
  cookTimeMinutes?: number; // Parsed numeric value for filtering
  servings?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    favorites: number;
    ratings: number;
  };
  avgRating?: number;
}

/**
 * Saved search configuration
 */
export interface SavedSearch {
  id: string;
  name: string;
  params: EnhancedSearchParams;
  userId: string;
  createdAt: Date;
  lastUsed: Date;
}

/**
 * Search analytics for optimization
 */
export interface SearchAnalytics {
  query: string;
  filters: EnhancedSearchParams;
  resultCount: number;
  timestamp: Date;
  userId?: string;
  clickedResults: string[]; // Recipe IDs that were clicked
}