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
import { Search, Heart, Plus, Clock, Users, ChefHat, AlertCircle } from 'lucide-react';
import { useRecipeSearch } from '@/hooks/use-recipes';
import { Recipe } from '@/types/recipe';
import StarRating from '@/components/ui/star-rating';
import { 
  LoadingSpinner, 
  LoadingButton, 
  RecipeGridSkeleton, 
  LoadingOverlay 
} from '@/components/ui/loading';
import ErrorBoundary from '@/components/error-boundary';

/**
 * Enhanced RecipeCard Component with Loading States
 */
const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  /**
   * Handles favorite toggle with loading state
   */
  const handleFavorite = async () => {
    if (favoriteLoading) return;
    
    try {
      setFavoriteLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setIsFavorite(!isFavorite);
      console.log(`${isFavorite ? 'Removed from' : 'Added to'} favorites:`, recipe.id);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert state on error
      setIsFavorite(isFavorite);
    } finally {
      setFavoriteLoading(false);
    }
  };

  /**
   * Handles rating submission with loading state
   */
  const handleRating = async (rating: number) => {
    if (ratingLoading) return;
    
    try {
      setRatingLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUserRating(rating);
      console.log('Rating submitted:', { recipeId: recipe.id, rating });
    } catch (error) {
      console.error('Failed to submit rating:', error);
      // Revert rating on error
      setUserRating(0);
    } finally {
      setRatingLoading(false);
    }
  };

  /**
   * Formats date for display
   */
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Truncates text for display
   */
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <ErrorBoundary fallback={
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">Failed to load recipe card</p>
      </div>
    }>
      <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* Recipe Image */}
        {recipe.image && (
          <div className="aspect-video overflow-hidden">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-6">
          {/* Header with Title and Favorite */}
          <header className="flex justify-between items-start mb-4">
            <Link href={`/recipes/${recipe.id}`} className="flex-1 mr-3">
              <h3 className="text-xl font-semibold text-gray-800 hover:text-blue-600 cursor-pointer line-clamp-2 transition-colors">
                {recipe.title}
              </h3>
            </Link>
            
            <LoadingButton
              loading={favoriteLoading}
              onClick={handleFavorite}
              variant="outline"
              size="sm"
              className={`p-2 rounded-full border-0 ${
                isFavorite 
                  ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''} transition-all`} />
            </LoadingButton>
          </header>

          {/* Author */}
          <p className="text-gray-600 mb-3 text-sm">
            By <span className="font-medium">{recipe.author.name}</span>
          </p>

          {/* Description */}
          {recipe.description && (
            <p className="text-gray-700 text-sm mb-4 line-clamp-2 leading-relaxed">
              {truncateText(recipe.description, 120)}
            </p>
          )}

          {/* Recipe Metadata */}
          <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
            {recipe.cookTime && (
              <div className="flex items-center" title="Cook time">
                <Clock className="w-4 h-4 mr-1" />
                <span>{recipe.cookTime}</span>
              </div>
            )}
            
            {recipe.servings && (
              <div className="flex items-center" title="Servings">
                <Users className="w-4 h-4 mr-1" />
                <span>{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
              </div>
            )}
            
            <div className="flex items-center" title="Difficulty">
              <ChefHat className="w-4 h-4 mr-1" />
              <span className="capitalize">{recipe.difficulty}</span>
            </div>
          </div>

          {/* Ingredients Preview */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Ingredients
            </h4>
            <div className="flex flex-wrap gap-2">
              {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                  title={ingredient}
                >
                  {truncateText(ingredient.split(',')[0], 15)}
                </span>
              ))}
              {recipe.ingredients.length > 3 && (
                <span className="text-gray-500 text-xs px-2 py-1">
                  +{recipe.ingredients.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.slice(0, 4).map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {recipe.tags.length > 4 && (
                  <span className="text-gray-500 text-xs px-2 py-1">
                    +{recipe.tags.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Rating Section */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Rate this recipe:</p>
              <div className={ratingLoading ? 'opacity-50 pointer-events-none' : ''}>
                <StarRating
                  rating={userRating}
                  onRate={handleRating}
                  size="sm"
                  interactive={!ratingLoading}
                />
              </div>
              {ratingLoading && (
                <div className="flex items-center mt-1">
                  <LoadingSpinner size="sm" className="mr-1" />
                  <span className="text-xs text-gray-500">Saving rating...</span>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <StarRating
                rating={recipe.avgRating || 0}
                interactive={false}
                size="sm"
                showCount={true}
                ratingCount={recipe._count?.ratings || 0}
              />
            </div>
          </div>

          {/* Creation Date */}
          <footer className="text-xs text-gray-500 border-t pt-3">
            Created {formatDate(recipe.createdAt)}
          </footer>
        </div>
      </article>
    </ErrorBoundary>
  );
};

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
  onClearFilters 
}: { 
  hasFilters: boolean; 
  onClearFilters: () => void; 
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
        <Link 
          href="/recipes/new"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          {hasFilters ? 'Add Recipe' : 'Share First Recipe'}
        </Link>
      </div>
    </div>
  );
};

/**
 * Main Homepage Component with Enhanced Loading
 */
export default function HomePage() {
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Use the custom hook for all state management
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
  const hasActiveFilters = searchTerm || difficulty;

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
        <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                TasteBuddy
              </Link>
              
              <div className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/" 
                  className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  Home
                </Link>
                <Link 
                  href="/profile/favorites" 
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  <Heart className="w-4 h-4 mr-1" />
                  Favorites
                </Link>
                <Link href="/food-feed" className="text-gray-600 hover:text-gray-900">
                  FoodFeed
                </Link>
                <Link 
                  href="/recipes/new" 
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center font-medium shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Recipe
                </Link>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <Link 
                  href="/recipes/new" 
                  className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </nav>

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
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 shadow-sm"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
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
                    <RecipeCard key={recipe.id} recipe={recipe} />
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
              />
            )}
          </section>
        </main>
      </div>
    </ErrorBoundary>
  );
}