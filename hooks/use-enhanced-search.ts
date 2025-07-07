/**
 * Enhanced Search Hook
 * 
 * Custom React hook for managing advanced search functionality
 * including state management, URL synchronization, and API calls.
 * 
 * @file hooks/use-enhanced-search.ts
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { 
  EnhancedSearchParams, 
  SearchFilters, 
  SortOption, 
  ViewMode,
  Recipe,
  EnhancedSearchResponse 
} from '@/types/enhanced-search';

/**
 * Default filter values
 */
const defaultFilters: SearchFilters = {
  difficulty: [],
  ingredients: [],
  tags: [],
  cookTimeRange: [0, 300],
  servingsRange: [1, 12],
  minRating: 0,
  dateRange: {
    start: null,
    end: null,
  },
};

/**
 * Search state interface
 */
interface SearchState {
  // Query state
  query: string;
  filters: SearchFilters;
  sortBy: SortOption;
  viewMode: ViewMode;
  currentPage: number;
  resultsPerPage: number;
  
  // Data state
  recipes: Recipe[];
  searchMeta: any;
  loading: boolean;
  error: string | null;
  
  // Computed state
  activeFilterCount: number;
  hasActiveSearch: boolean;
}

/**
 * Search actions interface
 */
interface SearchActions {
  // Query actions
  setQuery: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
  setSortBy: (sort: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  setCurrentPage: (page: number) => void;
  setResultsPerPage: (count: number) => void;
  
  // Search actions
  performSearch: () => Promise<void>;
  resetFilters: () => void;
  resetSearch: () => void;
  
  // Navigation actions
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
}

/**
 * Hook return type
 */
interface UseEnhancedSearchReturn {
  state: SearchState;
  actions: SearchActions;
}

/**
 * Enhanced search hook options
 */
interface UseEnhancedSearchOptions {
  /** API endpoint for search */
  apiEndpoint?: string;
  
  /** Default sort option */
  defaultSort?: SortOption;
  
  /** Default view mode */
  defaultView?: ViewMode;
  
  /** Default results per page */
  defaultLimit?: number;
  
  /** Whether to sync with URL */
  syncWithUrl?: boolean;
  
  /** Whether to auto-search on parameter changes */
  autoSearch?: boolean;
  
  /** Debounce delay for auto-search (ms) */
  debounceDelay?: number;
}

/**
 * Enhanced search custom hook
 */
export function useEnhancedSearch(options: UseEnhancedSearchOptions = {}): UseEnhancedSearchReturn {
  const {
    apiEndpoint = '/api/recipes/search',
    defaultSort = 'newest',
    defaultView = 'grid',
    defaultLimit = 12,
    syncWithUrl = true,
    autoSearch = true,
    debounceDelay = 300,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Core state
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [sortBy, setSortBy] = useState<SortOption>(defaultSort);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(defaultLimit);

  // Data state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchMeta, setSearchMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.difficulty.length > 0) count++;
    if (filters.ingredients.length > 0) count++;
    if (filters.tags.length > 0) count++;
    if (filters.cookTimeRange[0] > 0 || filters.cookTimeRange[1] < 300) count++;
    if (filters.servingsRange[0] > 1 || filters.servingsRange[1] < 12) count++;
    if (filters.minRating > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    return count;
  }, [filters]);

  const hasActiveSearch = useMemo(() => {
    return query.length > 0 || activeFilterCount > 0;
  }, [query, activeFilterCount]);

  /**
   * Build search parameters from current state
   */
  const buildSearchParams = useCallback((): EnhancedSearchParams => {
    return {
      query: query || undefined,
      difficulty: filters.difficulty.length > 0 ? filters.difficulty : undefined,
      ingredients: filters.ingredients.length > 0 ? filters.ingredients : undefined,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
      cookTimeMin: filters.cookTimeRange[0] > 0 ? filters.cookTimeRange[0] : undefined,
      cookTimeMax: filters.cookTimeRange[1] < 300 ? filters.cookTimeRange[1] : undefined,
      servingsMin: filters.servingsRange[0] > 1 ? filters.servingsRange[0] : undefined,
      servingsMax: filters.servingsRange[1] < 12 ? filters.servingsRange[1] : undefined,
      minRating: filters.minRating > 0 ? filters.minRating : undefined,
      createdAfter: filters.dateRange.start || undefined,
      createdBefore: filters.dateRange.end || undefined,
      sortBy,
      page: currentPage,
      limit: resultsPerPage,
    };
  }, [query, filters, sortBy, currentPage, resultsPerPage]);

  /**
   * Update URL with current search state
   */
  const updateUrl = useCallback(() => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams();
    
    if (query) params.set('q', query);
    if (sortBy !== defaultSort) params.set('sort', sortBy);
    if (viewMode !== defaultView) params.set('view', viewMode);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (resultsPerPage !== defaultLimit) params.set('limit', resultsPerPage.toString());
    
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [
    query, sortBy, viewMode, currentPage, resultsPerPage,
    pathname, router, syncWithUrl, defaultSort, defaultView, defaultLimit
  ]);

  /**
   * Parse URL parameters and update state
   */
  const parseUrlParams = useCallback(() => {
    if (!syncWithUrl) return;

    const urlQuery = searchParams.get('q') || '';
    const urlSort = (searchParams.get('sort') as SortOption) || defaultSort;
    const urlView = (searchParams.get('view') as ViewMode) || defaultView;
    const urlPage = parseInt(searchParams.get('page') || '1');
    const urlLimit = parseInt(searchParams.get('limit') || defaultLimit.toString());

    setQuery(urlQuery);
    setSortBy(urlSort);
    setViewMode(urlView);
    setCurrentPage(urlPage);
    setResultsPerPage(urlLimit);
  }, [searchParams, syncWithUrl, defaultSort, defaultView, defaultLimit]);

  /**
   * Perform search API call
   */
  const performSearch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams = buildSearchParams();
      const queryParams = new URLSearchParams();
      
      // Convert search params to URL query string
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
      
      const response = await fetch(`${apiEndpoint}?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data: EnhancedSearchResponse = await response.json();
      
      if (data.success) {
        setRecipes(data.data);
        setSearchMeta(data.meta);
      } else {
        throw new Error(data.error || 'Search failed');
      }
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setRecipes([]);
      setSearchMeta(null);
    } finally {
      setLoading(false);
    }
  }, [buildSearchParams, apiEndpoint]);

  /**
   * Reset filters to default state
   */
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  }, []);

  /**
   * Reset entire search state
   */
  const resetSearch = useCallback(() => {
    setQuery('');
    setFilters(defaultFilters);
    setSortBy(defaultSort);
    setCurrentPage(1);
    setRecipes([]);
    setSearchMeta(null);
    setError(null);
  }, [defaultSort]);

  /**
   * Navigation helpers
   */
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goToNextPage = useCallback(() => {
    if (searchMeta?.hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [searchMeta, currentPage, goToPage]);

  const goToPreviousPage = useCallback(() => {
    if (searchMeta?.hasPreviousPage) {
      goToPage(currentPage - 1);
    }
  }, [searchMeta, currentPage, goToPage]);

  /**
   * Enhanced setters that reset page when needed
   */
  const setQueryWithReset = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
  }, []);

  const setFiltersWithReset = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const setSortByWithReset = useCallback((newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1);
  }, []);

  const setResultsPerPageWithReset = useCallback((count: number) => {
    setResultsPerPage(count);
    setCurrentPage(1);
  }, []);

  // Initialize from URL on mount
  useEffect(() => {
    parseUrlParams();
  }, [parseUrlParams]);

  // Update URL when state changes
  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  // Auto-search when parameters change (with debouncing)
  useEffect(() => {
    if (!autoSearch) return;

    const timeoutId = setTimeout(() => {
      performSearch();
    }, debounceDelay);

    return () => clearTimeout(timeoutId);
  }, [
    query, filters, sortBy, currentPage, resultsPerPage,
    autoSearch, debounceDelay, performSearch
  ]);

  // Compose return object
  const state: SearchState = {
    query,
    filters,
    sortBy,
    viewMode,
    currentPage,
    resultsPerPage,
    recipes,
    searchMeta,
    loading,
    error,
    activeFilterCount,
    hasActiveSearch,
  };

  const actions: SearchActions = {
    setQuery: setQueryWithReset,
    setFilters: setFiltersWithReset,
    setSortBy: setSortByWithReset,
    setViewMode,
    setCurrentPage,
    setResultsPerPage: setResultsPerPageWithReset,
    performSearch,
    resetFilters,
    resetSearch,
    goToPage,
    goToNextPage,
    goToPreviousPage,
  };

  return { state, actions };
}

export default useEnhancedSearch;