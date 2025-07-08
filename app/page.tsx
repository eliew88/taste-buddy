/**
 * TasteBuddy Homepage with Enhanced Loading States
 * 
 * Updated homepage component that uses the new loading components
 * and provides better loading experiences throughout the interface.
 * 
 * Enhanced Features:
 * - Professional loading skeletons
 * - Loading buttons for interactive elements
 * - Better error boundaries integration
 * - Improved perceived performance
 * - Consistent loading patterns
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Search, Plus, AlertCircle, LogIn } from 'lucide-react';
import { useRecipeSearch } from '@/hooks/use-recipes';
import { useFavorites } from '@/hooks/use-favorites';
import { 
  LoadingSpinner, 
  LoadingButton, 
  RecipeGridSkeleton
} from '@/components/ui/loading';
import ErrorBoundary from '@/components/error-boundary';
import Navigation from '@/components/ui/navigation';
import RecipeCard from '@/components/ui/recipe-card';


/**
 * Enhanced Error Message Component with Better UX
 */
const ErrorMessage = ({ message, onRetry }: { message: string; onRetry: () => void }) => {
  const [retryLoading, setRetryLoading] = useState(false);

  const handleRetry = async () => {
    setRetryLoading(true);
    try {
      await onRetry();
    } finally {
      setRetryLoading(false);
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to load recipes</h3>
      <p className="text-red-700 mb-4">{message}</p>
      <LoadingButton
        loading={retryLoading}
        onClick={handleRetry}
        variant="primary"
        className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      >
        Try Again
      </LoadingButton>
    </div>
  );
};

/**
 * Enhanced Empty State Component
 */
const EmptyState = ({ 
  hasFilters, 
  onClearFilters,
  isAuthenticated 
}: { 
  hasFilters: boolean; 
  onClearFilters: () => void; 
  isAuthenticated: boolean;
}) => {
  const [clearLoading, setClearLoading] = useState(false);

  const handleClearFilters = async () => {
    setClearLoading(true);
    try {
      await onClearFilters();
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <div className="text-center py-16">
      <div className="text-gray-400 mb-6">
        <Search className="w-20 h-20 mx-auto" />
      </div>
      <h3 className="text-2xl font-semibold text-gray-600 mb-3">
        {hasFilters ? 'No recipes found' : 'No recipes yet'}
      </h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        {hasFilters 
          ? "Try adjusting your search criteria or clear the filters to see more recipes." 
          : "Be the first to share a delicious recipe with the TasteBuddy community!"
        }
      </p>
      <div className="flex justify-center space-x-4">
        {hasFilters && (
          <LoadingButton
            loading={clearLoading}
            onClick={handleClearFilters}
            variant="secondary"
          >
            Clear Filters
          </LoadingButton>
        )}
        {isAuthenticated ? (
          <Link 
            href="/recipes/new"
            className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            {hasFilters ? 'Add Recipe' : 'Share First Recipe'}
          </Link>
        ) : (
          <div className="flex space-x-4">
            <Link 
              href="/auth/signin"
              className="border border-purple-700 text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-purple-100 transition-colors inline-flex items-center"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </Link>
            <Link 
              href="/auth/signup"
              className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors inline-flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Join TasteBuddy
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main Homepage Component with Enhanced Loading
 */
export default function HomePage() {
  const [searchLoading, setSearchLoading] = useState(false);
  const { data: session } = useSession();
  
  // Use the custom hooks for state management
  const { isFavorited, toggleFavorite } = useFavorites();
  
  // Handle favorite toggle - same pattern as recipe details page
  const handleFavoriteToggle = async (recipeId: string) => {
    await toggleFavorite(recipeId);
  };
  const {
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
    refetch,
  } = useRecipeSearch();

  // Check if any filters are active
  const hasActiveFilters = !!(searchTerm || difficulty);

  /**
   * Enhanced search handler with loading state
   */
  const handleSearchWithLoading = async (value: string) => {
    setSearchLoading(true);
    try {
      handleSearch(value);
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 200));
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <Navigation />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <section className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 max-w-2xl mx-auto">
              Discover, cook, and share amazing recipes!
            </h1>
          </section>

          {/* Search Section */}
          <section className="mb-8">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search recipes, ingredients, or tags..."
                  value={searchTerm}
                  onChange={(e) => handleSearchWithLoading(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-900 placeholder-gray-500 shadow-sm"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
              
              <div className="flex justify-center">
                <select
                  value={difficulty}
                  onChange={(e) => handleDifficultyChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 bg-white shadow-sm"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </section>

          {/* Results Section */}
          <section>
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {hasActiveFilters ? 'Search Results' : 'Featured Recipes'}
                </h2>
                {!loading && (
                  <p className="text-gray-600 mt-1">
                    {pagination.total} recipe{pagination.total !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>
              
              {hasActiveFilters && (
                <LoadingButton
                  loading={false}
                  onClick={clearFilters}
                  variant="outline"
                >
                  Clear Filters
                </LoadingButton>
              )}
            </header>
            
            {/* Content */}
            {loading ? (
              <RecipeGridSkeleton count={6} />
            ) : error ? (
              <ErrorMessage message={error} onRetry={refetch} />
            ) : recipes.length > 0 ? (
              <>
                {/* Recipe Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                  {recipes.map(recipe => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe}
                      isFavorited={isFavorited(recipe.id)}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <nav className="flex justify-center items-center space-x-2" aria-label="Pagination">
                    <LoadingButton
                      loading={false}
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrevPage}
                      variant="outline"
                    >
                      Previous
                    </LoadingButton>
                    
                    <span className="px-4 py-2 text-gray-600 font-medium">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    
                    <LoadingButton
                      loading={false}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                      variant="outline"
                    >
                      Next
                    </LoadingButton>
                  </nav>
                )}
              </>
            ) : (
              <EmptyState 
                hasFilters={hasActiveFilters} 
                onClearFilters={clearFilters}
                isAuthenticated={!!session}
              />
            )}
          </section>
        </main>
      </div>
    </ErrorBoundary>
  );
}