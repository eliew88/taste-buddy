/**
 * Custom React Hooks for Recipe Management
 * 
 * This module provides a set of custom React hooks for managing recipe data,
 * search functionality, and UI state. These hooks encapsulate API calls,
 * loading states, error handling, and pagination logic.
 * 
 * @author TasteBuddy Development Team
 * @version 1.0.0
 */

// hooks/use-recipes.ts
import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import { Recipe } from '@/types/recipe';

/**
 * Configuration parameters for the useRecipes hook
 */
interface UseRecipesParams {
  /** Text to search for in recipes */
  search?: string;
  /** Filter by recipe difficulty level */
  difficulty?: string;
  /** Page number for pagination */
  page?: number;
  /** Number of results per page */
  limit?: number;
  /** Whether to automatically fetch data on mount (default: true) */
  autoFetch?: boolean;
}

/**
 * Return type for the useRecipes hook
 */
interface UseRecipesReturn {
  /** Array of recipe objects */
  recipes: Recipe[];
  /** Loading state indicator */
  loading: boolean;
  /** Error message if request failed */
  error: string | null;
  /** Pagination metadata */
  pagination: {
    /** Current page number */
    page: number;
    /** Total number of pages */
    totalPages: number;
    /** Total number of recipes */
    total: number;
    /** Whether there are more pages after current */
    hasNextPage: boolean;
    /** Whether there are pages before current */
    hasPrevPage: boolean;
  };
  /** Function to fetch recipes with new parameters */
  fetchRecipes: (params?: UseRecipesParams) => Promise<void>;
  /** Function to refetch with current parameters */
  refetch: () => Promise<void>;
  /** Function to clear any error state */
  resetError: () => void;
}

/**
 * Main hook for fetching and managing recipe data
 * 
 * This hook provides comprehensive recipe data management including
 * fetching, loading states, error handling, and pagination. It can be
 * configured to auto-fetch on mount or only fetch when explicitly called.
 * 
 * @param initialParams - Initial configuration parameters
 * @returns Object containing recipes, loading state, and control functions
 * 
 * @example
 * ```typescript
 * import { useRecipes } from '@/hooks/use-recipes';
 * 
 * // Basic usage with auto-fetch
 * const { recipes, loading, error } = useRecipes();
 * 
 * // With search parameters
 * const { recipes, fetchRecipes } = useRecipes({
 *   search: 'chocolate',
 *   difficulty: 'easy',
 *   limit: 6
 * });
 * 
 * // Manual fetching only
 * const { recipes, fetchRecipes } = useRecipes({ autoFetch: false });
 * ```
 */
export function useRecipes(initialParams: UseRecipesParams = {}): UseRecipesReturn {
  // State management for recipes and UI state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  
  // Current search parameters
  const [currentParams, setCurrentParams] = useState<UseRecipesParams>({
    page: 1,
    limit: 12,
    autoFetch: true,
    ...initialParams,
  });

  /**
   * Fetches recipes from the API with the specified parameters
   * 
   * @param params - Optional parameters to override current settings
   */
  const fetchRecipes = useCallback(async (params?: UseRecipesParams) => {
    const fetchParams = { ...currentParams, ...params };
    setCurrentParams(fetchParams);

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getRecipes({
        page: fetchParams.page,
        limit: fetchParams.limit,
        search: fetchParams.search?.trim() || undefined,
        difficulty: fetchParams.difficulty || undefined,
      });

      if (response.success) {
        setRecipes(response.data);
        setPagination(response.pagination);
      } else {
        throw new Error(response.error || 'Failed to fetch recipes');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recipes';
      setError(errorMessage);
      setRecipes([]);
      console.error('Failed to fetch recipes:', err);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to prevent infinite re-renders

  /**
   * Refetches recipes using the current parameters
   * Useful for retry functionality or manual refresh
   */
  const refetch = useCallback(() => {
    return fetchRecipes();
  }, [fetchRecipes]);

  /**
   * Clears any existing error state
   * Useful for dismissing error messages
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch on component mount if enabled
  useEffect(() => {
    if (currentParams.autoFetch !== false) {
      fetchRecipes();
    }
  }, []); // Only run on mount

  return {
    recipes,
    loading,
    error,
    pagination,
    fetchRecipes,
    refetch,
    resetError,
  };
}

/**
 * Specialized hook for recipe search functionality
 * 
 * This hook combines recipe fetching with search state management,
 * including debounced search input and filter controls. It's designed
 * specifically for search pages and components that need real-time
 * search capabilities.
 * 
 * @returns Object containing search state, recipes, and control functions
 * 
 * @example
 * ```typescript
 * import { useRecipeSearch } from '@/hooks/use-recipes';
 * 
 * function SearchPage() {
 *   const {
 *     recipes,
 *     loading,
 *     searchTerm,
 *     difficulty,
 *     handleSearch,
 *     handleDifficultyChange,
 *     clearFilters
 *   } = useRecipeSearch();
 * 
 *   return (
 *     <div>
 *       <input 
 *         value={searchTerm} 
 *         onChange={(e) => handleSearch(e.target.value)} 
 *       />
 *       <select 
 *         value={difficulty} 
 *         onChange={(e) => handleDifficultyChange(e.target.value)}
 *       >
 *         <option value="">All</option>
 *         <option value="easy">Easy</option>
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRecipeSearch() {
  // Search state management
  const [searchTerm, setSearchTerm] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Recipe data management (disable auto-fetch since we control it)
  const { recipes, loading, error, pagination, fetchRecipes, resetError } = useRecipes({
    autoFetch: false,
  });

  /**
   * Debounce search term to prevent excessive API calls
   * Search is delayed by 300ms to allow user to finish typing
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /**
   * Fetch recipes when search parameters change
   * Automatically resets to page 1 when filters change
   */
  useEffect(() => {
    fetchRecipes({
      search: debouncedSearch,
      difficulty,
      page: 1,
    });
  }, [debouncedSearch, difficulty, fetchRecipes]);

  /**
   * Updates the search term and triggers debounced search
   * 
   * @param value - New search term
   */
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  /**
   * Updates the difficulty filter and triggers immediate search
   * 
   * @param value - New difficulty filter ('easy', 'medium', 'hard', or '')
   */
  const handleDifficultyChange = useCallback((value: string) => {
    setDifficulty(value);
  }, []);

  /**
   * Handles page navigation while preserving current filters
   * 
   * @param page - Page number to navigate to
   */
  const handlePageChange = useCallback((page: number) => {
    fetchRecipes({
      search: debouncedSearch,
      difficulty,
      page,
    });
  }, [debouncedSearch, difficulty, fetchRecipes]);

  /**
   * Clears all search filters and resets to initial state
   */
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setDifficulty('');
  }, []);

  return {
    recipes,
    loading,
    error,
    pagination,
    searchTerm,
    difficulty,
    handleSearch,
    handleDifficultyChange,
    handlePageChange,
    clearFilters,
    refetch: () => fetchRecipes({ search: debouncedSearch, difficulty }),
    resetError,
  };
}

/**
 * Hook for managing user's favorite recipes
 * 
 * This hook will fetch and manage the current user's favorite recipes.
 * Currently returns the same data as useRecipes but will be modified
 * to call a specific favorites endpoint when implemented.
 * 
 * @returns Object containing favorite recipes and management functions
 * 
 * @example
 * ```typescript
 * import { useFavoriteRecipes } from '@/hooks/use-recipes';
 * 
 * function FavoritesPage() {
 *   const { recipes: favorites, loading } = useFavoriteRecipes();
 *   
 *   if (loading) return <div>Loading favorites...</div>;
 *   
 *   return (
 *     <div>
 *       {favorites.map(recipe => (
 *         <RecipeCard key={recipe.id} recipe={recipe} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @future This will be updated to call /api/users/favorites endpoint
 */
export function useFavoriteRecipes() {
  return useRecipes({
    // This would be modified to call a different endpoint for favorites
    // when the favorites API is implemented
    autoFetch: true,
  });
}

/**
 * Hook for fetching recipes created by a specific user
 * 
 * This hook will fetch recipes authored by a particular user.
 * Currently uses the standard recipe endpoint but will be modified
 * to filter by user when the backend supports it.
 * 
 * @param userId - The ID of the user whose recipes to fetch
 * @returns Object containing user's recipes and management functions
 * 
 * @example
 * ```typescript
 * import { useUserRecipes } from '@/hooks/use-recipes';
 * 
 * function UserProfilePage({ userId }: { userId: string }) {
 *   const { recipes: userRecipes, loading } = useUserRecipes(userId);
 *   
 *   return (
 *     <div>
 *       <h2>User's Recipes</h2>
 *       {userRecipes.map(recipe => (
 *         <RecipeCard key={recipe.id} recipe={recipe} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @future This will be updated to include user filtering in the API call
 */
export function useUserRecipes(userId?: string) {
  return useRecipes({
    // This would include user filtering when implemented
    // For now, only auto-fetch if userId is provided
    autoFetch: !!userId,
  });
}