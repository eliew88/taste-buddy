/**
 * Enhanced FoodFeed Page with Back to Home Navigation
 * 
 * Advanced search page for discovering recipes with comprehensive filtering options.
 * Now includes a prominent "Back to Home" navigation option at the top.
 * 
 * @file app/food-feed/page.tsx
 */

'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Recipe } from '@/types/recipe';
import { 
  Search, 
  Grid3X3, 
  List, 
  Filter,
  Loader2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Clock,
  Users as UsersIcon,
  SortAsc
} from 'lucide-react';

import Navigation from '@/components/ui/Navigation';
import AdvancedSearchFilters from '@/components/ui/advanced-search-filters';
import RecipeCard from '@/components/ui/recipe-card';
import MealCard from '@/components/ui/meal-card';
import { Meal } from '@/types/meal';
import apiClient from '@/lib/api-client';

/**
 * Type definitions
 */
type SortOption = 'newest' | 'oldest' | 'popular' | 'rating' | 'title' | 'cookTime' | 'difficulty';
type ViewMode = 'grid' | 'list';
type ContentType = 'recipes' | 'meals';

type RecipePosterFilter = 'everyone' | 'following' | 'my-own';

interface SearchFilters {
  difficulty: string[];
  ingredients: string[];
  excludedIngredients: string[];
  tags: string[];
  cookTimeRange: [number, number];
  servingsRange: [number, number];
  minRating: number;
  recipePoster: RecipePosterFilter;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

interface MealFilters {
  recipePoster: RecipePosterFilter;
}

/**
 * Default filter values
 */
const defaultFilters: SearchFilters = {
  difficulty: [],
  ingredients: [],
  excludedIngredients: [],
  tags: [],
  cookTimeRange: [0, 300],
  servingsRange: [1, 12],
  minRating: 0,
  recipePoster: 'everyone',
  dateRange: {
    start: null,
    end: null,
  },
};

const defaultMealFilters: MealFilters = {
  recipePoster: 'everyone',
};

/**
 * Sort options configuration
 */
const sortOptions: Array<{ value: SortOption; label: string; icon: React.ReactNode }> = [
  { value: 'newest', label: 'Newest First', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'popular', label: 'Most Popular', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'rating', label: 'Highest Rated', icon: <div className="w-4 h-4 text-yellow-500">★</div> },
  { value: 'title', label: 'A-Z', icon: <SortAsc className="w-4 h-4" /> },
  { value: 'cookTime', label: 'Quickest', icon: <Clock className="w-4 h-4" /> },
  { value: 'difficulty', label: 'Easiest First', icon: <UsersIcon className="w-4 h-4" /> },
];

/**
 * Default filter options (fallback)
 */
const defaultFilterOptions = {
  difficulties: [
    { value: 'easy', label: 'Easy', count: 0 },
    { value: 'medium', label: 'Medium', count: 0 },
    { value: 'hard', label: 'Hard', count: 0 },
  ],
  popularIngredients: [],
  tags: [],
  cookTimeStats: {
    min: 5,
    max: 300,
    average: 45,
  },
  servingsStats: {
    min: 1,
    max: 12,
    average: 4,
  },
};

/**
 * Enhanced pagination component
 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
        className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        Previous
      </button>
      
      <span className="px-3 py-2 text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </span>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        Next
      </button>
    </div>
  );
};

/**
 * Main FoodFeed Page Component
 */
function FoodFeedPageContent() {
  // Next.js hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  

  // State management  
  const [contentType, setContentType] = useState<ContentType>(() => {
    const type = searchParams.get('type');
    return (type === 'meals' || type === 'recipes') ? type : 'recipes';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [localQuery, setLocalQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [mealFilters, setMealFilters] = useState<MealFilters>(defaultMealFilters);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(12);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Data states
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [searchMeta, setSearchMeta] = useState<{total: number, pages: number, currentPage: number, suggestions?: string[]} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState(defaultFilterOptions);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  // Computed values
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (contentType === 'recipes') {
      if (filters.difficulty.length > 0) count++;
      if (filters.ingredients.length > 0) count++;
      if (filters.excludedIngredients.length > 0) count++;
      if (filters.tags.length > 0) count++;
      if (filters.minRating > 0) count++;
      if (filters.recipePoster !== 'everyone') count++;
    } else {
      if (mealFilters.recipePoster !== 'everyone') count++;
    }
    return count;
  }, [contentType, filters, mealFilters]);

  // Initialize local query
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setFilterOptionsLoading(true);
        const response = await fetch('/api/recipes/filter-options');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch filter options: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setFilterOptions(data.data);
        } else {
          console.error('Filter options fetch failed:', data.error);
          // Keep using default options
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
        // Keep using default options
      } finally {
        setFilterOptionsLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  // Event handlers
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create search params with the new query immediately
    const params = new URLSearchParams();
    
    // Add the current local query (what user just typed)
    if (localQuery.trim()) {
      params.append('query', localQuery.trim());
    }
    
    // Add current filters
    if (filters.difficulty.length > 0) {
      filters.difficulty.forEach(d => params.append('difficulty', d));
    }
    
    if (filters.ingredients.length > 0) {
      filters.ingredients.forEach(ing => params.append('ingredients', ing));
    }
    
    if (filters.excludedIngredients.length > 0) {
      filters.excludedIngredients.forEach(ing => params.append('excludedIngredients', ing));
    }
    
    if (filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }
    
    
    
    if (filters.minRating > 0) {
      params.append('minRating', filters.minRating.toString());
    }
    
    if (filters.recipePoster !== 'everyone') {
      params.append('recipePoster', filters.recipePoster);
    }
    
    
    // Add sorting and pagination
    params.append('sortBy', sortBy);
    params.append('page', '1'); // Reset to page 1 for new search
    params.append('limit', resultsPerPage.toString());
    
    // Update state and perform search immediately
    setSearchQuery(localQuery);
    setCurrentPage(1);
    performSearch(params);
  };

  const handleQuickSearch = (searchTerm: string) => {
    setLocalQuery(searchTerm);
    setSearchQuery(searchTerm);
    setCurrentPage(1);
    // The useEffect will handle the search trigger
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContentTypeChange = (newContentType: ContentType) => {
    setContentType(newContentType);
    setCurrentPage(1);
    setError(null);
    
    // Reset sort option if switching to meals and current sort is not valid for meals
    if (newContentType === 'meals') {
      const validMealSorts = ['newest', 'oldest', 'title'];
      if (!validMealSorts.includes(sortBy)) {
        setSortBy('newest');
      }
    }
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', newContentType);
    router.push(`/food-feed?${params.toString()}`);
    
    // Clear data from the other content type
    if (newContentType === 'recipes') {
      setMeals([]);
    } else {
      setRecipes([]);
    }
  };

  const handleMealFiltersChange = (newFilters: MealFilters) => {
    setMealFilters(newFilters);
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  /**
   * Build search parameters from current state
   */
  const buildSearchParams = () => {
    const params = new URLSearchParams();
    
    // Add basic search query
    if (searchQuery.trim()) {
      params.append('query', searchQuery.trim());
    }
    
    // Add filters
    if (filters.difficulty.length > 0) {
      filters.difficulty.forEach(d => params.append('difficulty', d));
    }
    
    if (filters.ingredients.length > 0) {
      filters.ingredients.forEach(ing => params.append('ingredients', ing));
    }
    
    if (filters.excludedIngredients.length > 0) {
      filters.excludedIngredients.forEach(ing => params.append('excludedIngredients', ing));
    }
    
    if (filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }
    
    
    
    if (filters.minRating > 0) {
      params.append('minRating', filters.minRating.toString());
    }
    
    if (filters.recipePoster !== 'everyone') {
      params.append('recipePoster', filters.recipePoster);
    }
    
    
    // Add sorting and pagination
    params.append('sortBy', sortBy);
    params.append('page', currentPage.toString());
    params.append('limit', resultsPerPage.toString());
    
    return params;
  };

  /**
   * Perform search API call
   */
  const performSearch = async (searchParams?: URLSearchParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = searchParams || buildSearchParams();
      const response = await fetch(`/api/recipes/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRecipes(data.data || []);
        // Map pagination data to searchMeta format
        const pagination = data.pagination;
        if (pagination) {
          setSearchMeta({
            total: pagination.total,
            pages: pagination.totalPages,
            currentPage: pagination.page,
          });
        } else {
          setSearchMeta(null);
        }
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
  };

  const performMealSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use public meals endpoint that doesn't require authentication
      const response = await apiClient.getPublicMeals({
        search: searchQuery || undefined,
        recipePoster: mealFilters.recipePoster,
        page: currentPage,
        limit: resultsPerPage,
      });
      
      let filteredMeals = response.meals || [];
      
      // Apply client-side sorting based on sortBy option
      const sortedMeals = [...filteredMeals].sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'title': // A-Z sorting by name
            return a.name.localeCompare(b.name);
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
      
      setMeals(sortedMeals);
      setSearchMeta({
        total: response.total,
        pages: Math.ceil(response.total / response.limit),
        currentPage: response.page,
      });
      
    } catch (err) {
      console.error('Meal search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch memories');
      setMeals([]);
      setSearchMeta(null);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search when dependencies change
  useEffect(() => {
    if (contentType === 'recipes') {
      const searchParams = buildSearchParams();
      performSearch(searchParams);
    } else {
      performMealSearch();
    }
  }, [contentType, searchQuery, filters, mealFilters, sortBy, currentPage, resultsPerPage]);

  // Refetch data when page becomes visible (user returns from creating content)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (contentType === 'recipes') {
          const searchParams = buildSearchParams();
          performSearch(searchParams);
        } else {
          performMealSearch();
        }
      }
    };

    const handleFocus = () => {
      if (contentType === 'recipes') {
        const searchParams = buildSearchParams();
        performSearch(searchParams);
      } else {
        performMealSearch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [contentType, searchQuery, filters, mealFilters, sortBy, currentPage, resultsPerPage]);

  return (
    <div className="min-h-screen">
      {/* Main Navigation */}
      <Navigation />
      
      {/* Page Header */}
      <div className="border-b border-gray-200" style={{ backgroundColor: '#CFE8EF' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Page Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Food Feed</h1>
            </div>

            {/* Content Type Toggle */}
            <div className="flex items-center space-x-1 bg-white rounded-lg p-1 w-fit">
              <button
                onClick={() => handleContentTypeChange('recipes')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  contentType === 'recipes'
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                style={contentType === 'recipes' ? { backgroundColor: '#B370B0' } : {}}
              >
                Recipes
              </button>
              <button
                onClick={() => handleContentTypeChange('meals')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  contentType === 'meals'
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                style={contentType === 'meals' ? { backgroundColor: '#B370B0' } : {}}
              >
                Memories
              </button>
            </div>
            
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder={contentType === 'recipes' ? "Search recipes, ingredients, or tags..." : "Search memories..."}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:border-[#B370B0]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 text-white rounded-lg hover:opacity-90 focus:ring-2 disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#B370B0' }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Search'
                )}
              </button>
            </form>

          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-6">
              {contentType === 'recipes' ? (
                <AdvancedSearchFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  filterOptions={filterOptions}
                  loading={filterOptionsLoading}
                  onResetFilters={handleResetFilters}
                  activeFilterCount={activeFilterCount}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={() => setMealFilters(defaultMealFilters)}
                        className="text-sm hover:opacity-80"
                        style={{ color: '#B370B0' }}
                      >
                        Clear ({activeFilterCount})
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <UsersIcon className="w-4 h-4 mr-2" />
                        See Recipes From...
                      </h4>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="recipePosterDesktop"
                            checked={mealFilters.recipePoster === 'everyone'}
                            onChange={() => handleMealFiltersChange({
                              ...mealFilters,
                              recipePoster: 'everyone'
                            })}
                            className="w-4 h-4 border-gray-300"
                            style={{ accentColor: '#B370B0' }}
                          />
                          <span className="text-sm text-gray-700">Everyone</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="recipePosterDesktop"
                            checked={mealFilters.recipePoster === 'following'}
                            onChange={() => handleMealFiltersChange({
                              ...mealFilters,
                              recipePoster: 'following'
                            })}
                            className="w-4 h-4 border-gray-300"
                            style={{ accentColor: '#B370B0' }}
                          />
                          <span className="text-sm text-gray-700">People I Follow</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="recipePosterDesktop"
                            checked={mealFilters.recipePoster === 'my-own'}
                            onChange={() => handleMealFiltersChange({
                              ...mealFilters,
                              recipePoster: 'my-own'
                            })}
                            className="w-4 h-4 border-gray-300"
                            style={{ accentColor: '#B370B0' }}
                          />
                          <span className="text-sm text-gray-700">Only My Own</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              {/* Results Info */}
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {searchMeta && searchMeta.total !== undefined ? (
                    <>
                      {searchMeta.total.toLocaleString()} {contentType === 'recipes' ? (searchMeta.total !== 1 ? 'Recipes' : 'Recipe') : (searchMeta.total !== 1 ? 'Memories' : 'Memory')}
                      {searchQuery && ` for "${searchQuery}"`}
                    </>
                  ) : (
                    contentType === 'recipes' ? 'Recipes' : 'Memories'
                  )}
                </h2>
                
                {activeFilterCount > 0 && (
                  <span className="text-white text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#B370B0' }}>
                    {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                  </span>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-3">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="lg:hidden flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-2 text-white text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#B370B0' }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-[#B370B0]"
                >
                  {contentType === 'meals' ? (
                    // Meal-specific sort options
                    <>
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="title">A-Z</option>
                    </>
                  ) : (
                    // Recipe sort options
                    sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  )}
                </select>

                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleViewModeChange('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors rounded-l-lg`}
                    style={viewMode === 'grid' ? { backgroundColor: '#B370B0' } : {}}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={`p-2 ${viewMode === 'list' ? 'text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors rounded-r-lg`}
                    style={viewMode === 'list' ? { backgroundColor: '#B370B0' } : {}}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Filters Panel */}
            {filtersOpen && (
              <div className="lg:hidden mb-6 border border-gray-200 rounded-lg bg-white">
                {contentType === 'recipes' ? (
                  <AdvancedSearchFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    filterOptions={filterOptions}
                    loading={filterOptionsLoading}
                    onResetFilters={handleResetFilters}
                    activeFilterCount={activeFilterCount}
                  />
                ) : (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={() => setMealFilters(defaultMealFilters)}
                          className="text-sm hover:opacity-80"
                          style={{ color: '#B370B0' }}
                        >
                          Clear ({activeFilterCount})
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <UsersIcon className="w-4 h-4 mr-2" />
                          See Recipes From...
                        </h4>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="recipePoster"
                              checked={mealFilters.recipePoster === 'everyone'}
                              onChange={() => handleMealFiltersChange({
                                ...mealFilters,
                                recipePoster: 'everyone'
                              })}
                              className="w-4 h-4 border-gray-300"
                              style={{ accentColor: '#B370B0' }}
                            />
                            <span className="text-sm text-gray-700">Everyone</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="recipePoster"
                              checked={mealFilters.recipePoster === 'following'}
                              onChange={() => handleMealFiltersChange({
                                ...mealFilters,
                                recipePoster: 'following'
                              })}
                              className="w-4 h-4 border-gray-300"
                              style={{ accentColor: '#B370B0' }}
                            />
                            <span className="text-sm text-gray-700">People I Follow</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="recipePoster"
                              checked={mealFilters.recipePoster === 'my-own'}
                              onChange={() => handleMealFiltersChange({
                                ...mealFilters,
                                recipePoster: 'my-own'
                              })}
                              className="w-4 h-4 border-gray-300"
                              style={{ accentColor: '#B370B0' }}
                            />
                            <span className="text-sm text-gray-700">Only My Own</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-700 mx-auto mb-4" />
                <p className="text-gray-600">Searching for {contentType === 'recipes' ? 'delicious recipes' : 'amazing memories'}...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Error</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => contentType === 'recipes' ? performSearch() : performMealSearch()}
                  className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* No Results */}
            {!loading && !error && 
             ((contentType === 'recipes' && recipes.length === 0) || 
              (contentType === 'meals' && meals.length === 0)) && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No {contentType === 'recipes' ? 'recipes' : 'memories'} found
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || activeFilterCount > 0
                    ? "Try adjusting your search criteria or filters."
                    : `Search for ${contentType === 'recipes' ? 'recipes' : 'memories'} using the search bar above${contentType === 'recipes' ? ', or try the advanced filters' : ''}.`}
                </p>
                
                {/* Search Suggestions */}
                {searchMeta?.suggestions && Array.isArray(searchMeta.suggestions) && searchMeta.suggestions.length > 0 && (
                  <div className="text-left max-w-md mx-auto mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">Suggestions:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {searchMeta.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => contentType === 'recipes' ? handleResetFilters() : setMealFilters(defaultMealFilters)}
                    className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Results */}
            {!loading && !error && 
             ((contentType === 'recipes' && recipes.length > 0) || 
              (contentType === 'meals' && meals.length > 0)) && (
              <div className="space-y-6">
                {/* Results Grid/List */}
                <div className={
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-6"
                }>
                  {contentType === 'recipes' 
                    ? recipes.map((recipe: Recipe) => (
                        <RecipeCard 
                          key={recipe.id} 
                          recipe={recipe}
                          className={viewMode === 'list' ? 'flex' : ''}
                          showFavoriteButton={false}
                          showRecipeBookButton={true}
                        />
                      ))
                    : meals.map((meal: Meal) => (
                        <MealCard 
                          key={meal.id} 
                          meal={meal}
                          className={viewMode === 'list' ? 'flex' : ''}
                          isListView={viewMode === 'list'}
                        />
                      ))
                  }
                </div>

                {/* Pagination */}
                {searchMeta && searchMeta.pages && searchMeta.pages > 1 && (
                  <div className="flex flex-col items-center space-y-4">
                    <Pagination
                      currentPage={searchMeta.currentPage || 1}
                      totalPages={searchMeta.pages}
                      hasNextPage={searchMeta.currentPage < searchMeta.pages}
                      hasPreviousPage={searchMeta.currentPage > 1}
                      onPageChange={handlePageChange}
                    />
                    
                    {/* Results per page selector */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Show:</span>
                      <select
                        value={resultsPerPage}
                        onChange={(e) => {
                          setResultsPerPage(parseInt(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded px-2 py-1"
                      >
                        <option value={6}>6 per page</option>
                        <option value={12}>12 per page</option>
                        <option value={24}>24 per page</option>
                        <option value={48}>48 per page</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FoodFeedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#B370B0' }} />
        </div>
      </div>
    }>
      <FoodFeedPageContent />
    </Suspense>
  );
}