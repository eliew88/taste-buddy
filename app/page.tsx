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

import { useState, useEffect, useCallback } from 'react';
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
import Navigation from '@/components/ui/Navigation';
import RecipeCard from '@/components/ui/recipe-card';
import MealCard from '@/components/ui/meal-card';
import RecipeStatsSection from '@/components/recipe-stats-section';
import { getDailyHeroContent } from '@/lib/daily-content';
import apiClient from '@/lib/api-client';
import { Meal } from '@/types/meal';

// Fallback images in case database doesn't have enough recipes with images
const FALLBACK_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1980&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2181&q=80',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1965&q=80'
];

/**
 * Hero Section Component with 4-Panel Background
 */
const HeroSection = ({ 
  searchTerm, 
  difficulty, 
  onSearch, 
  onDifficultyChange, 
  searchLoading,
  heroImages = FALLBACK_HERO_IMAGES
}: {
  searchTerm: string;
  difficulty: string;
  onSearch: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  searchLoading: boolean;
  heroImages?: string[];
}) => {
  // Use deterministic daily content to prevent hydration mismatch
  const dailyContent = getDailyHeroContent(heroImages);
  const heroQuote = dailyContent.quote;
  const selectedImage = dailyContent.image;
  
  console.log('🎨 HeroSection rendering with images:', heroImages);
  
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Single Random Recipe Background */}
      <div className="absolute inset-0 z-0">
        {selectedImage ? (
          <div 
            className="w-full h-full bg-cover bg-center transition-transform duration-700"
            style={{ 
              backgroundImage: `url(${selectedImage})` 
            }}
          />
        ) : (
          /* Fallback gradient background */
          <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-800" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 py-12 max-w-4xl mx-auto">
        {/* Hero Text */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-purple-300 mb-4 font-serif italic" style={{
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.6)',
            WebkitTextStroke: '1px rgba(0, 0, 0, 0.3)'
          }}>
            {heroQuote.text}
          </h1>
          {heroQuote.author && heroQuote.author !== 'Unknown' && (
            <p className="text-xl md:text-2xl text-purple-200 font-medium" style={{
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
            }}>
              — {heroQuote.author}
            </p>
          )}
        </div>
        
        {/* Search Section */}
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipes, ingredients, or tags..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-gray-900 placeholder-gray-500 shadow-lg backdrop-blur-sm bg-purple-200/90 text-lg"
            />
            {searchLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <select
              value={difficulty}
              onChange={(e) => onDifficultyChange(e.target.value)}
              className="px-6 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 bg-purple-200/90 shadow-lg backdrop-blur-sm text-lg"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>
    </section>
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
  const [heroImages, setHeroImages] = useState<string[]>(FALLBACK_HERO_IMAGES);
  const { data: session } = useSession();
  
  // Use the custom hooks for state management
  const { isFavorited, toggleFavorite } = useFavorites();
  
  // Handle favorite toggle - same pattern as recipe details page
  const handleFavoriteToggle = async (recipeId: string) => {
    await toggleFavorite(recipeId);
  };

  // Fetch recipes with images for hero background
  const fetchHeroImages = async () => {
    try {
      console.log('🔍 Fetching recipes for hero background...');
      const response = await fetch('/api/recipes?limit=4&featured=true');
      if (response.ok) {
        const data = await response.json();
        console.log('📊 API Response:', data);
        const recipesWithImages = data.data.filter((recipe: any) => recipe.images && recipe.images.length > 0);
        console.log('🖼️ Recipes with images:', recipesWithImages.length);
        console.log('📸 Image URLs:', recipesWithImages.map((recipe: any) => {
          const primaryImage = recipe.images?.find((img: any) => img.isPrimary) || recipe.images?.[0];
          return primaryImage?.url;
        }));
        
        if (recipesWithImages.length > 0) {
          const dbImages = recipesWithImages.map((recipe: any) => {
            const primaryImage = recipe.images?.find((img: any) => img.isPrimary) || recipe.images?.[0];
            return primaryImage?.url;
          }).filter(Boolean);
          const allImages = [...dbImages, ...FALLBACK_HERO_IMAGES];
          console.log('✅ Setting hero images:', allImages);
          setHeroImages(allImages);
        } else {
          // Use fallback images if no recipes with images
          console.log('🔄 Using fallback images');
          setHeroImages(FALLBACK_HERO_IMAGES);
        }
      }
    } catch (error) {
      console.error('Error fetching hero images:', error);
      // Keep fallback images on error
      setHeroImages(FALLBACK_HERO_IMAGES);
    }
  };

  // Fetch hero images on component mount
  useEffect(() => {
    fetchHeroImages();
  }, []);
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

  // For featured recipes (no filters), we want top 6 without pagination
  const [featuredRecipes, setFeaturedRecipes] = useState<any[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredError, setFeaturedError] = useState<string | null>(null);

  // For recent meals from all users
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [mealsError, setMealsError] = useState<string | null>(null);

  // Fetch top 6 featured recipes when no filters are active
  const fetchFeaturedRecipes = useCallback(async () => {
    try {
      setFeaturedLoading(true);
      setFeaturedError(null);
      
      const response = await fetch('/api/recipes?limit=6&featured=true');
      const data = await response.json();
      
      if (data.success) {
        setFeaturedRecipes(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch featured recipes');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch featured recipes';
      setFeaturedError(errorMessage);
      setFeaturedRecipes([]);
      console.error('Failed to fetch featured recipes:', err);
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  // Fetch 6 most recent meals from all users
  const fetchRecentMeals = useCallback(async () => {
    try {
      setMealsLoading(true);
      setMealsError(null);
      
      const response = await fetch('/api/meals/recent?limit=6');
      const data = await response.json();
      
      if (data.success) {
        setRecentMeals(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch recent meals');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recent meals';
      setMealsError(errorMessage);
      setRecentMeals([]);
      console.error('Failed to fetch recent meals:', err);
    } finally {
      setMealsLoading(false);
    }
  }, []);

  // Check if any filters are active
  const hasActiveFilters = !!(searchTerm || difficulty);

  // Fetch featured recipes and recent meals when component mounts and when filters are cleared
  useEffect(() => {
    if (!hasActiveFilters) {
      fetchFeaturedRecipes();
      fetchRecentMeals();
    }
  }, [hasActiveFilters, fetchFeaturedRecipes, fetchRecentMeals]);

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
      <div className="min-h-screen">
        {/* Navigation */}
        <Navigation />

        {/* Hero Section with 4-Panel Background */}
        <HeroSection 
          searchTerm={searchTerm}
          difficulty={difficulty}
          onSearch={handleSearchWithLoading}
          onDifficultyChange={handleDifficultyChange}
          searchLoading={searchLoading}
          heroImages={heroImages}
        />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Results Section */}
          <section>
            <header className="mb-8">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {hasActiveFilters ? 'Search Results' : 'Featured Recipes'}
                </h2>
                {hasActiveFilters ? (
                  !loading && (
                    <p className="text-gray-600">
                      {pagination.total} recipe{pagination.total !== 1 ? 's' : ''} found
                    </p>
                  )
                ) : null}
              </div>
              
              {hasActiveFilters && (
                <div className="text-center">
                  <LoadingButton
                    loading={false}
                    onClick={clearFilters}
                    variant="outline"
                  >
                    Clear Filters
                  </LoadingButton>
                </div>
              )}
            </header>
            
            {/* Content */}
            {hasActiveFilters ? (
              // Search Results with Pagination
              <>
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
                    
                    {/* Pagination for Search Results */}
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
              </>
            ) : (
              // Featured Recipes without Pagination
              <>
                {featuredLoading ? (
                  <RecipeGridSkeleton count={6} />
                ) : featuredError ? (
                  <ErrorMessage message={featuredError} onRetry={() => fetchFeaturedRecipes()} />
                ) : featuredRecipes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {featuredRecipes.map(recipe => (
                      <RecipeCard 
                        key={recipe.id} 
                        recipe={recipe}
                        isFavorited={isFavorited(recipe.id)}
                        onFavoriteToggle={handleFavoriteToggle}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    hasFilters={false} 
                    onClearFilters={clearFilters}
                    isAuthenticated={!!session}
                  />
                )}
              </>
            )}
          </section>
        </main>

        {/* Recently Cooked Meals Section - only show when no active filters */}
        {!hasActiveFilters && (
          <section className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Recently Cooked Meals</h2>
              <p className="text-gray-600">Fresh meal memories from the TasteBuddy community</p>
            </div>

            {mealsLoading ? (
              <RecipeGridSkeleton count={6} />
            ) : mealsError ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Meals</h3>
                <p className="text-gray-600 mb-4">{mealsError}</p>
                <button
                  onClick={fetchRecentMeals}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : recentMeals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                {recentMeals.map(meal => (
                  <MealCard 
                    key={meal.id} 
                    meal={meal}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No meals yet</h3>
                <p className="text-gray-500 mb-6">
                  Be the first to share a meal memory with the community!
                </p>
                {session && (
                  <Link
                    href="/meals/new"
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Your First Meal</span>
                  </Link>
                )}
              </div>
            )}

            {recentMeals.length > 0 && (
              <div className="text-center">
                <Link
                  href="/food-feed?type=meals"
                  className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <span>View All Meals</span>
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Recipe Statistics Section - only show when no active filters */}
        {!hasActiveFilters && !featuredLoading && (
          <RecipeStatsSection />
        )}
      </div>
    </ErrorBoundary>
  );
}