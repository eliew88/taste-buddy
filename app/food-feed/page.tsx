/**
 * Working FoodFeed Page - Without Custom Hook Dependencies
 * 
 * A simplified version that works with standard React hooks
 * and doesn't depend on the custom useEnhancedSearch hook.
 * 
 * @file app/food-feed/page.tsx
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

import AdvancedSearchFilters from '@/components/ui/advanced-search-filters';
import RecipeCard from '@/components/ui/recipe-card';

/**
 * Type definitions
 */
type SortOption = 'newest' | 'oldest' | 'popular' | 'rating' | 'title' | 'cookTime' | 'difficulty';
type ViewMode = 'grid' | 'list';

interface SearchFilters {
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
 * Mock filter options
 */
const mockFilterOptions = {
  difficulties: [
    { value: 'easy', label: 'Easy', count: 156 },
    { value: 'medium', label: 'Medium', count: 89 },
    { value: 'hard', label: 'Hard', count: 34 },
  ],
  popularIngredients: [
    { name: 'chicken', count: 45 },
    { name: 'garlic', count: 78 },
    { name: 'onion', count: 92 },
    { name: 'tomato', count: 56 },
    { name: 'cheese', count: 34 },
    { name: 'flour', count: 67 },
    { name: 'olive oil', count: 89 },
    { name: 'salt', count: 123 },
  ],
  tags: [
    { name: 'healthy', count: 67 },
    { name: 'quick', count: 89 },
    { name: 'vegetarian', count: 45 },
    { name: 'dessert', count: 23 },
    { name: 'comfort-food', count: 34 },
    { name: 'gluten-free', count: 28 },
    { name: 'low-carb', count: 41 },
    { name: 'family-friendly', count: 56 },
  ],
  cookTimeStats: { min: 5, max: 300, average: 45 },
  servingsStats: { min: 1, max: 12, average: 4 },
};

/**
 * Default filter state
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
 * Loading skeleton component
 */
const RecipeCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      <div className="flex space-x-2">
        <div className="h-6 bg-gray-200 rounded w-16"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

/**
 * Search statistics component
 */
interface SearchStatsProps {
  totalResults: number;
  searchTime: number;
  currentPage: number;
  resultsPerPage: number;
}

const SearchStats: React.FC<SearchStatsProps> = ({
  totalResults,
  searchTime,
  currentPage,
  resultsPerPage,
}) => {
  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, totalResults);
  
  return (
    <div className="text-sm text-gray-600">
      Showing {startResult.toLocaleString()}-{endResult.toLocaleString()} of {totalResults.toLocaleString()} recipes
      <span className="ml-2 text-xs text-gray-500">
        ({searchTime}ms)
      </span>
    </div>
  );
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
export default function FoodFeedPage() {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [localQuery, setLocalQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(12);
  
  // Data states
  const [recipes, setRecipes] = useState<any[]>([]);
  const [searchMeta, setSearchMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  // Initialize local query
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Event handlers
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localQuery);
    setCurrentPage(1);
    performSearch();
  };

  const handleQuickSearch = (searchTerm: string) => {
    setLocalQuery(searchTerm);
    setSearchQuery(searchTerm);
    setCurrentPage(1);
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
    
    if (filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }
    
    if (filters.cookTimeRange[0] > 0) {
      params.append('cookTimeMin', filters.cookTimeRange[0].toString());
    }
    
    if (filters.cookTimeRange[1] < 300) {
      params.append('cookTimeMax', filters.cookTimeRange[1].toString());
    }
    
    if (filters.servingsRange[0] > 1) {
      params.append('servingsMin', filters.servingsRange[0].toString());
    }
    
    if (filters.servingsRange[1] < 12) {
      params.append('servingsMax', filters.servingsRange[1].toString());
    }
    
    if (filters.minRating > 0) {
      params.append('minRating', filters.minRating.toString());
    }
    
    if (filters.dateRange.start) {
      params.append('createdAfter', filters.dateRange.start);
    }
    
    if (filters.dateRange.end) {
      params.append('createdBefore', filters.dateRange.end);
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
  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams = buildSearchParams();
      const response = await fetch(`/api/recipes/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRecipes(data.data || []);
        setSearchMeta(data.meta || null);
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

  // Trigger search when dependencies change
  useEffect(() => {
    if (searchQuery || activeFilterCount > 0) {
      performSearch();
    }
  }, [searchQuery, filters, sortBy, currentPage, resultsPerPage]);

  // Initial load - fetch some default recipes
  useEffect(() => {
    performSearch();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Page Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FoodFeed</h1>
              <p className="text-gray-600 mt-1">
                Discover amazing recipes with advanced search and filtering
              </p>
            </div>
            
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder="Search recipes, ingredients, or tags..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Search'
                )}
              </button>
            </form>

            {/* Quick Search Suggestions */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Popular searches:</span>
              {['chicken recipes', 'vegetarian', 'quick meals', 'desserts', 'healthy'].map(term => (
                <button
                  key={term}
                  onClick={() => handleQuickSearch(term)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-6">
              <AdvancedSearchFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                filterOptions={mockFilterOptions}
                loading={false}
                onResetFilters={handleResetFilters}
                activeFilterCount={activeFilterCount}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Controls Bar */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Search Stats */}
                  {searchMeta && (
                    <SearchStats
                      totalResults={searchMeta.totalResults || 0}
                      searchTime={searchMeta.searchTime || 0}
                      currentPage={searchMeta.currentPage || currentPage}
                      resultsPerPage={searchMeta.resultsPerPage || resultsPerPage}
                    />
                  )}
                  {!searchMeta && !loading && (
                    <div className="text-sm text-gray-600">
                      Ready to search recipes
                    </div>
                  )}
                  {loading && (
                    <div className="text-sm text-gray-600 flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Searching...
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  {/* Mobile Filter Toggle */}
                  <button
                    onClick={() => setFiltersOpen(true)}
                    className="lg:hidden flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Sort Dropdown */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 hidden sm:inline">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value as SortOption)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="hidden sm:flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => handleViewModeChange('grid')}
                      className={`p-2 ${
                        viewMode === 'grid' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Grid view"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleViewModeChange('list')}
                      className={`p-2 ${
                        viewMode === 'list' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="List view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            {loading ? (
              <div className="space-y-6">
                <div className={
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }>
                  {Array.from({ length: resultsPerPage }).map((_, index) => (
                    <RecipeCardSkeleton key={index} />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Search Error
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={performSearch}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : recipes.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No recipes found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || activeFilterCount > 0
                    ? "Try adjusting your search criteria or filters."
                    : "Search for recipes using the search bar above, or try the advanced filters."}
                </p>
                
                {/* Search Suggestions */}
                {searchMeta?.suggestions && (
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
                    onClick={handleResetFilters}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Recipe Grid/List */}
                <div className={
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-6"
                }>
                  {recipes.map((recipe: any) => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe}
                      className={viewMode === 'list' ? 'flex' : ''}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {searchMeta && searchMeta.totalPages > 1 && (
                  <div className="flex flex-col items-center space-y-4">
                    <Pagination
                      currentPage={searchMeta.currentPage}
                      totalPages={searchMeta.totalPages}
                      hasNextPage={searchMeta.hasNextPage}
                      hasPreviousPage={searchMeta.hasPreviousPage}
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
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={12}>12 per page</option>
                        <option value={24}>24 per page</option>
                        <option value={36}>36 per page</option>
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

      {/* Mobile Filter Modal */}
      {filtersOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute inset-y-0 left-0 w-80 bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-md text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <AdvancedSearchFilters
                filters={filters}
                onFiltersChange={(newFilters) => {
                  handleFiltersChange(newFilters);
                  setFiltersOpen(false);
                }}
                filterOptions={mockFilterOptions}
                loading={false}
                onResetFilters={() => {
                  handleResetFilters();
                  setFiltersOpen(false);
                }}
                activeFilterCount={activeFilterCount}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}