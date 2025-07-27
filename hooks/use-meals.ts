/**
 * Custom React Hooks for Meal Management
 * 
 * This module provides a set of custom React hooks for managing meal data,
 * search functionality, and UI state. These hooks encapsulate API calls,
 * loading states, error handling, and pagination logic for meal memories.
 * 
 * @author TasteBuddy Development Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import { Meal, MealFilters } from '@/types/meal';

/**
 * Configuration parameters for the useMeals hook
 */
interface UseMealsParams extends MealFilters {
  /** Whether to automatically fetch data on mount (default: true) */
  autoFetch?: boolean;
}

/**
 * Return type for the useMeals hook
 */
interface UseMealsReturn {
  /** Array of meal objects */
  meals: Meal[];
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
    /** Total number of meals */
    total: number;
    /** Whether there are more pages after current */
    hasNextPage: boolean;
    /** Whether there are pages before current */
    hasPrevPage: boolean;
  };
  /** Function to fetch meals with new parameters */
  fetchMeals: (params?: UseMealsParams) => Promise<void>;
  /** Function to refetch with current parameters */
  refetch: () => Promise<void>;
  /** Function to clear any error state */
  resetError: () => void;
}

/**
 * Main hook for fetching and managing meal data
 * 
 * This hook provides comprehensive meal data management including
 * fetching, loading states, error handling, and pagination. It fetches
 * meals for the current authenticated user only.
 * 
 * @param initialParams - Initial configuration parameters
 * @returns Object containing meals, loading state, and control functions
 * 
 * @example
 * ```typescript
 * import { useMeals } from '@/hooks/use-meals';
 * 
 * // Basic usage with auto-fetch
 * const { meals, loading, error } = useMeals();
 * 
 * // With search parameters
 * const { meals, fetchMeals } = useMeals({
 *   search: 'pasta',
 *   limit: 6
 * });
 * 
 * // Manual fetching only
 * const { meals, fetchMeals } = useMeals({ autoFetch: false });
 * ```
 */
export function useMeals(initialParams: UseMealsParams = {}): UseMealsReturn {
  // State management for meals and UI state
  const [meals, setMeals] = useState<Meal[]>([]);
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
  const [currentParams, setCurrentParams] = useState<UseMealsParams>({
    page: 1,
    limit: 12,
    autoFetch: true,
    ...initialParams,
  });

  /**
   * Fetches meals from the API with the specified parameters
   * 
   * @param params - Optional parameters to override current settings
   */
  const fetchMeals = useCallback(async (params?: UseMealsParams) => {
    const fetchParams = { ...currentParams, ...params };
    setCurrentParams(fetchParams);

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getMeals({
        page: fetchParams.page,
        limit: fetchParams.limit,
        search: fetchParams.search?.trim() || undefined,
        dateFrom: fetchParams.dateFrom,
        dateTo: fetchParams.dateTo,
      });

      setMeals(response.meals);
      setPagination({
        page: response.page,
        totalPages: Math.ceil(response.total / response.limit),
        total: response.total,
        hasNextPage: response.hasMore,
        hasPrevPage: response.page > 1
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch meals';
      setError(errorMessage);
      setMeals([]);
      console.error('Failed to fetch meals:', err);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to prevent infinite re-renders

  /**
   * Refetches meals using the current parameters
   * Useful for retry functionality or manual refresh
   */
  const refetch = useCallback(() => {
    return fetchMeals();
  }, [fetchMeals]);

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
      fetchMeals();
    }
  }, []); // Only run on mount

  return {
    meals,
    loading,
    error,
    pagination,
    fetchMeals,
    refetch,
    resetError,
  };
}

/**
 * Specialized hook for meal search functionality
 * 
 * This hook combines meal fetching with search state management,
 * including debounced search input and date range filtering. It's designed
 * specifically for meal journal pages and components that need real-time
 * search capabilities.
 * 
 * @returns Object containing search state, meals, and control functions
 * 
 * @example
 * ```typescript
 * import { useMealSearch } from '@/hooks/use-meals';
 * 
 * function MealJournalPage() {
 *   const {
 *     meals,
 *     loading,
 *     searchTerm,
 *     dateFrom,
 *     dateTo,
 *     handleSearch,
 *     handleDateChange,
 *     clearFilters
 *   } = useMealSearch();
 * 
 *   return (
 *     <div>
 *       <input 
 *         value={searchTerm} 
 *         onChange={(e) => handleSearch(e.target.value)} 
 *       />
 *       <input 
 *         type="date" 
 *         value={dateFrom?.toISOString().split('T')[0] || ''} 
 *         onChange={(e) => handleDateChange('from', e.target.value)} 
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useMealSearch() {
  // Search state management
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Meal data management (disable auto-fetch since we control it)
  const { meals, loading, error, pagination, fetchMeals, resetError } = useMeals({
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
   * Fetch meals when search parameters change
   * Automatically resets to page 1 when filters change
   */
  useEffect(() => {
    fetchMeals({
      search: debouncedSearch,
      dateFrom,
      dateTo,
      page: 1,
    });
  }, [debouncedSearch, dateFrom, dateTo, fetchMeals]);

  /**
   * Updates the search term and triggers debounced search
   * 
   * @param value - New search term
   */
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  /**
   * Updates date filters and triggers immediate search
   * 
   * @param type - Which date to update ('from' or 'to')
   * @param value - New date value as string
   */
  const handleDateChange = useCallback((type: 'from' | 'to', value: string) => {
    const date = value ? new Date(value) : undefined;
    if (type === 'from') {
      setDateFrom(date);
    } else {
      setDateTo(date);
    }
  }, []);

  /**
   * Handles page navigation while preserving current filters
   * 
   * @param page - Page number to navigate to
   */
  const handlePageChange = useCallback((page: number) => {
    fetchMeals({
      search: debouncedSearch,
      dateFrom,
      dateTo,
      page,
    });
  }, [debouncedSearch, dateFrom, dateTo, fetchMeals]);

  /**
   * Clears all search filters and resets to initial state
   */
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setDateFrom(undefined);
    setDateTo(undefined);
  }, []);

  return {
    meals,
    loading,
    error,
    pagination,
    searchTerm,
    dateFrom,
    dateTo,
    handleSearch,
    handleDateChange,
    handlePageChange,
    clearFilters,
    refetch: () => fetchMeals({ search: debouncedSearch, dateFrom, dateTo }),
    resetError,
  };
}

/**
 * Hook for fetching a single meal by ID
 * 
 * This hook fetches a specific meal and provides loading/error states.
 * Useful for meal detail pages and components that display individual meals.
 * 
 * @param mealId - The ID of the meal to fetch
 * @returns Object containing meal data, loading state, and control functions
 * 
 * @example
 * ```typescript
 * import { useMeal } from '@/hooks/use-meals';
 * 
 * function MealDetailPage({ mealId }: { mealId: string }) {
 *   const { meal, loading, error, refetch } = useMeal(mealId);
 *   
 *   if (loading) return <div>Loading meal...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!meal) return <div>Meal not found</div>;
 *   
 *   return (
 *     <div>
 *       <h1>{meal.name}</h1>
 *       <p>{meal.description}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMeal(mealId?: string) {
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the meal from the API
   */
  const fetchMeal = useCallback(async () => {
    if (!mealId) {
      setMeal(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getMeal(mealId);

      if (response.success && response.data) {
        setMeal(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch meal');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch meal';
      setError(errorMessage);
      setMeal(null);
      console.error('Failed to fetch meal:', err);
    } finally {
      setLoading(false);
    }
  }, [mealId]);

  /**
   * Clears any existing error state
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch meal when mealId changes
  useEffect(() => {
    fetchMeal();
  }, [fetchMeal]);

  return {
    meal,
    loading,
    error,
    refetch: fetchMeal,
    resetError,
  };
}