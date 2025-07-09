/**
 * Enhanced FoodFeed Page with Back to Home Navigation
 * 
 * Advanced search page for discovering recipes with comprehensive filtering options.
 * Now includes a prominent "Back to Home" navigation option at the top.
 * 
 * @file app/food-feed/page.tsx
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
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
  SortAsc,
  ArrowLeft
} from 'lucide-react';

import Navigation from '@/components/ui/Navigation';
import AdvancedSearchFilters from '@/components/ui/advanced-search-filters';
import RecipeCard from '@/components/ui/recipe-card';
import { useFavorites } from '@/hooks/use-favorites';

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
 * Mock filter options for demonstration
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
    { name: 'salt', count: 134 },
  ],
  tags: [
    { name: 'vegetarian', count: 67 },
    { name: 'quick meals', count: 89 },
    { name: 'healthy', count: 45 },
    { name: 'comfort food', count: 34 },
    { name: 'dessert', count: 56 },
    { name: 'gluten-free', count: 23 },
  ],
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
export default function FoodFeedPage() {
  // Favorites hook
  const { isFavorited, toggleFavorite } = useFavorites();
  
  // Handle favorite toggle - same pattern as recipe details page
  const handleFavoriteToggle = async (recipeId: string) => {
    await toggleFavorite(recipeId);
  };

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [localQuery, setLocalQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(12);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Data states
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchMeta, setSearchMeta] = useState<{total: number, pages: number, currentPage: number, suggestions?: string[]} | null>(null);
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

  // Initialize local query
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

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

  // Trigger search when dependencies change
  useEffect(() => {
    const searchParams = buildSearchParams();
    performSearch(searchParams);
  }, [searchQuery, filters, sortBy, currentPage, resultsPerPage]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Navigation */}
      <Navigation />
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Page Title and Description */}
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 focus:ring-2 focus:ring-green-600 disabled:opacity-50 transition-colors"
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

      {/* Main Content Container */}
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

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              {/* Results Info */}
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {searchMeta && searchMeta.total !== undefined ? (
                    <>
                      {searchMeta.total.toLocaleString()} Recipe{searchMeta.total !== 1 ? 's' : ''}
                      {searchQuery && ` for "${searchQuery}"`}
                    </>
                  ) : (
                    'Recipes'
                  )}
                </h2>
                
                {activeFilterCount > 0 && (
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
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
                    <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleViewModeChange('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-green-700 text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors rounded-l-lg`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-green-700 text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors rounded-r-lg`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Filters Panel */}
            {filtersOpen && (
              <div className="lg:hidden mb-6 border border-gray-200 rounded-lg bg-white">
                <AdvancedSearchFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  filterOptions={mockFilterOptions}
                  loading={false}
                  onResetFilters={handleResetFilters}
                  activeFilterCount={activeFilterCount}
                />
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-700 mx-auto mb-4" />
                <p className="text-gray-600">Searching for delicious recipes...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Error</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => performSearch()}
                  className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* No Results */}
            {!loading && !error && recipes.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No recipes found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || activeFilterCount > 0
                    ? "Try adjusting your search criteria or filters."
                    : "Search for recipes using the search bar above, or try the advanced filters."}
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
                    onClick={handleResetFilters}
                    className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Recipe Results */}
            {!loading && !error && recipes.length > 0 && (
              <div className="space-y-6">
                {/* Recipe Grid/List */}
                <div className={
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-6"
                }>
                  {recipes.map((recipe: Recipe) => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe}
                      className={viewMode === 'list' ? 'flex' : ''}
                      isFavorited={isFavorited(recipe.id)}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  ))}
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