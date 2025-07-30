/**
 * API Client for TasteBuddy Recipe Platform
 * 
 * This module provides a centralized HTTP client for making API requests
 * to the TasteBuddy backend. It handles all recipe-related operations,
 * user management, and future features like ratings and favorites.
 * 
 * @author TasteBuddy Development Team
 * @version 1.0.0
 */

// lib/api-client.ts
import { Recipe, CreateRecipeData, UpdateRecipeData } from '@/types/recipe';
import { Meal, CreateMealData, UpdateMealData, MealListResponse, MealFilters } from '@/types/meal';

/**
 * Standard API response wrapper interface
 * @template T The type of data returned in successful responses
 */
interface ApiResponse<T> {
  /** Indicates if the API request was successful */
  success: boolean;
  /** The response data (only present when success is true) */
  data?: T;
  /** Error message (only present when success is false) */
  error?: string;
}

/**
 * Recipe list response with pagination metadata
 * Extends the standard ApiResponse to include pagination information
 */
interface RecipeListResponse {
  /** Indicates if the API request was successful */
  success: boolean;
  /** Array of recipe objects */
  data: Recipe[];
  /** Pagination metadata for managing large datasets */
  pagination: {
    /** Current page number (1-based) */
    page: number;
    /** Number of items per page */
    limit: number;
    /** Total number of recipes matching the query */
    total: number;
    /** Total number of pages available */
    totalPages: number;
    /** Whether there are more pages after the current one */
    hasNextPage: boolean;
    /** Whether there are pages before the current one */
    hasPrevPage: boolean;
  };
  /** Error message (only present when success is false) */
  error?: string;
}

/**
 * Search parameters for filtering and paginating recipe requests
 */
interface SearchParams {
  /** Text to search for in recipe titles, descriptions, ingredients, and tags */
  search?: string;
  /** Filter by recipe difficulty level */
  difficulty?: string;
  /** Page number for pagination (default: 1) */
  page?: number;
  /** Number of results per page (default: 12, max: 50) */
  limit?: number;
}

/**
 * API Client class for handling HTTP requests to the TasteBuddy backend
 * 
 * This class centralizes all API communication and provides type-safe methods
 * for interacting with recipes, users, ratings, and favorites. It handles
 * request formatting, error handling, and response parsing.
 * 
 * @example
 * ```typescript
 * const client = new ApiClient('/api');
 * const recipes = await client.getRecipes({ search: 'chocolate' });
 * ```
 */
class ApiClient {
  private baseUrl: string;

  /**
   * Creates a new API client instance
   * @param baseUrl - The base URL for API requests (default: '/api')
   */
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Makes an HTTP request to the specified endpoint
   * 
   * @template T The expected response type
   * @param endpoint - The API endpoint path (e.g., '/recipes')
   * @param options - Fetch API options (method, headers, body, etc.)
   * @returns Promise resolving to the parsed JSON response
   * @throws Error if the request fails or returns a non-OK status
   * 
   * @private This method is used internally by other public methods
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse the error response, use the status
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      console.error('Request config:', config);
      throw error;
    }
  }

  // ==================== RECIPE ENDPOINTS ====================

  /**
   * Fetches a list of recipes with optional filtering and pagination
   * 
   * @param params - Search and pagination parameters
   * @param params.search - Text to search for in recipes
   * @param params.difficulty - Filter by difficulty ('easy', 'medium', 'hard')
   * @param params.page - Page number (default: 1)
   * @param params.limit - Results per page (default: 12, max: 50)
   * @returns Promise resolving to recipe list with pagination metadata
   * 
   * @example
   * ```typescript
   * // Get first page of all recipes
   * const allRecipes = await client.getRecipes();
   * 
   * // Search for chocolate recipes
   * const chocolateRecipes = await client.getRecipes({ search: 'chocolate' });
   * 
   * // Get easy recipes on page 2
   * const easyRecipes = await client.getRecipes({ 
   *   difficulty: 'easy', 
   *   page: 2 
   * });
   * ```
   */
  async getRecipes(params: SearchParams = {}): Promise<RecipeListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.search) searchParams.append('search', params.search);
    if (params.difficulty) searchParams.append('difficulty', params.difficulty);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    
    // Use the main recipes endpoint for all requests (it handles search parameters)
    const endpoint = `/recipes${queryString ? `?${queryString}` : ''}`;
    
    return this.request<RecipeListResponse>(endpoint);
  }

  /**
   * Fetches a single recipe by its ID
   * 
   * @param id - The unique recipe identifier
   * @returns Promise resolving to the recipe data
   * 
   * @example
   * ```typescript
   * const recipe = await client.getRecipe('recipe-123');
   * if (recipe.success) {
   *   console.log(recipe.data.title);
   * }
   * ```
   */
  async getRecipe(id: string): Promise<ApiResponse<Recipe>> {
    return this.request<ApiResponse<Recipe>>(`/recipes/${id}`);
  }

  /**
   * Creates a new recipe
   * 
   * @param data - The recipe data to create
   * @returns Promise resolving to the created recipe
   * 
   * @example
   * ```typescript
   * const newRecipe = await client.createRecipe({
   *   title: 'Chocolate Cake',
   *   ingredients: ['flour', 'sugar', 'cocoa'],
   *   instructions: 'Mix and bake...',
   *   difficulty: 'medium'
   * });
   * ```
   */
  async createRecipe(data: CreateRecipeData): Promise<ApiResponse<Recipe>> {
    return this.request<ApiResponse<Recipe>>('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Updates an existing recipe
   * 
   * @param id - The recipe ID to update
   * @param data - Partial recipe data to update
   * @returns Promise resolving to the updated recipe
   * 
   * @example
   * ```typescript
   * const updated = await client.updateRecipe('recipe-123', {
   *   title: 'Updated Recipe Title'
   * });
   * ```
   */
  async updateRecipe(id: string, data: UpdateRecipeData): Promise<ApiResponse<Recipe>> {
    return this.request<ApiResponse<Recipe>>(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Deletes a recipe by ID
   * 
   * @param id - The recipe ID to delete
   * @returns Promise resolving when deletion is complete
   * 
   * @example
   * ```typescript
   * await client.deleteRecipe('recipe-123');
   * ```
   */
  async deleteRecipe(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/recipes/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== MEAL ENDPOINTS ====================

  /**
   * Fetches a list of meals for the current user with optional filtering and pagination
   * 
   * @param params - Search and pagination parameters
   * @param params.search - Text to search for in meal names and descriptions
   * @param params.dateFrom - Filter meals from this date onwards
   * @param params.dateTo - Filter meals up to this date
   * @param params.page - Page number (default: 1)
   * @param params.limit - Results per page (default: 12, max: 50)
   * @returns Promise resolving to meal list with pagination metadata
   * 
   * @example
   * ```typescript
   * // Get first page of all user's meals
   * const allMeals = await client.getMeals();
   * 
   * // Search for meals containing "pasta"
   * const pastaMeals = await client.getMeals({ search: 'pasta' });
   * 
   * // Get meals from the past week
   * const recentMeals = await client.getMeals({ 
   *   dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
   * });
   * ```
   */
  async getMeals(params: MealFilters = {}): Promise<MealListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.search) searchParams.append('search', params.search);
    if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom.toISOString());
    if (params.dateTo) searchParams.append('dateTo', params.dateTo.toISOString());
    if (params.mealType) searchParams.append('mealType', params.mealType);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = `/meals${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<{
      success: boolean;
      data: Meal[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    }>(endpoint);
    
    // Transform API response to match MealListResponse interface
    return {
      meals: response.data || [],
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 12,
      hasMore: response.pagination?.hasNextPage || false,
    };
  }

  /**
   * Fetches a single meal by its ID
   * 
   * @param id - The unique meal identifier
   * @returns Promise resolving to the meal data
   * 
   * @example
   * ```typescript
   * const meal = await client.getMeal('meal-123');
   * if (meal.success) {
   *   console.log(meal.data.name);
   * }
   * ```
   */
  async getMeal(id: string): Promise<ApiResponse<Meal>> {
    return this.request<ApiResponse<Meal>>(`/meals/${id}`);
  }

  /**
   * Creates a new meal
   * 
   * @param data - The meal data to create
   * @returns Promise resolving to the created meal
   * 
   * @example
   * ```typescript
   * const newMeal = await client.createMeal({
   *   name: 'Delicious Pasta',
   *   description: 'Had this amazing pasta for dinner',
   *   date: new Date(),
   *   images: [...]
   * });
   * ```
   */
  async createMeal(data: CreateMealData): Promise<ApiResponse<Meal>> {
    return this.request<ApiResponse<Meal>>('/meals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Updates an existing meal
   * 
   * @param id - The meal ID to update
   * @param data - Partial meal data to update
   * @returns Promise resolving to the updated meal
   * 
   * @example
   * ```typescript
   * const updated = await client.updateMeal('meal-123', {
   *   name: 'Updated Meal Name'
   * });
   * ```
   */
  async updateMeal(id: string, data: UpdateMealData): Promise<ApiResponse<Meal>> {
    return this.request<ApiResponse<Meal>>(`/meals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Deletes a meal by ID
   * 
   * @param id - The meal ID to delete
   * @returns Promise resolving when deletion is complete
   * 
   * @example
   * ```typescript
   * await client.deleteMeal('meal-123');
   * ```
   */
  async deleteMeal(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/meals/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== RATING ENDPOINTS ====================

  /**
   * Submits a rating for a recipe
   * 
   * @param recipeId - The ID of the recipe to rate
   * @param rating - The rating value (1-5)
   * @returns Promise resolving when rating is submitted
   * 
   * @example
   * ```typescript
   * await client.rateRecipe('recipe-123', 5);
   * ```
   * 
   * @future This endpoint is not yet implemented in the backend
   */
  async rateRecipe(recipeId: string, rating: number): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/recipes/${recipeId}/rating`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  }

  // ==================== FAVORITE ENDPOINTS ====================

  /**
   * Toggles the favorite status of a recipe for the current user
   * 
   * @param recipeId - The ID of the recipe to favorite/unfavorite
   * @returns Promise resolving to the new favorite status
   * 
   * @example
   * ```typescript
   * const result = await client.toggleFavorite('recipe-123');
   * console.log(result.data.isFavorite); // true or false
   * ```
   * 
   * @future This endpoint is not yet implemented in the backend
   */
  async toggleFavorite(recipeId: string): Promise<ApiResponse<{ isFavorite: boolean }>> {
    return this.request<ApiResponse<{ isFavorite: boolean }>>(`/recipes/${recipeId}/favorite`, {
      method: 'POST',
    });
  }

  /**
   * Fetches the current user's favorite recipes
   * 
   * @returns Promise resolving to a list of favorite recipes
   * 
   * @example
   * ```typescript
   * const favorites = await client.getFavorites();
   * ```
   * 
   * @future This endpoint is not yet implemented in the backend
   */
  async getFavorites(): Promise<RecipeListResponse> {
    return this.request<RecipeListResponse>('/users/favorites');
  }

  // ==================== USER ENDPOINTS ====================

  /**
   * Fetches user information by ID
   * 
   * @param id - The user ID
   * @returns Promise resolving to user data
   * 
   * @future This endpoint is not yet implemented in the backend
   */
  async getUser(id: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request<ApiResponse<Record<string, unknown>>>(`/users/${id}`);
  }

  /**
   * Updates user information
   * 
   * @param id - The user ID to update
   * @param data - User data to update
   * @returns Promise resolving to updated user data
   * 
   * @future This endpoint is not yet implemented in the backend
   */
  async updateUser(id: string, data: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request<ApiResponse<Record<string, unknown>>>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

/**
 * Singleton API client instance
 * 
 * This is the main instance that should be used throughout the application.
 * It's configured with the default base URL and ready to use.
 * 
 * @example
 * ```typescript
 * import apiClient from '@/lib/api-client';
 * const recipes = await apiClient.getRecipes();
 * ```
 */
const apiClient = new ApiClient();

export default apiClient;

/**
 * Convenience exports for individual API methods
 * 
 * These exports allow you to import specific methods directly instead of
 * using the full client object. Useful for cleaner imports in components.
 * 
 * @example
 * ```typescript
 * import { getRecipes, createRecipe } from '@/lib/api-client';
 * 
 * const recipes = await getRecipes({ search: 'pasta' });
 * const newRecipe = await createRecipe(recipeData);
 * ```
 */
export const {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getMeals,
  getMeal,
  createMeal,
  updateMeal,
  deleteMeal,
  rateRecipe,
  toggleFavorite,
  getFavorites,
  getUser,
  updateUser,
} = apiClient;