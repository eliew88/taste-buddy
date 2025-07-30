/**
 * Recipe Detail Page
 * 
 * Dynamic route page that displays full recipe information including
 * ingredients, instructions, metadata, and user interactions.
 * 
 * Location: app/recipes/[id]/page.tsx
 * 
 * Features:
 * - Full recipe display with rich formatting
 * - Interactive rating and favorite buttons
 * - Responsive design for all screen sizes
 * - Error handling and loading states
 * - Navigation back to homepage
 * - Print-friendly layout
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  ChefHat, 
  Heart, 
  Star, 
  Calendar,
  User,
  AlertCircle,
  Printer,
  Share2,
  Edit,
  Coins,
  Info
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Recipe } from '@/types/recipe';
import { getOptimizedImageUrl } from '@/lib/image-client-utils';
import { useFavorites } from '@/hooks/use-favorites';
import CommentForm from '@/components/comment-form';
import CommentsSection from '@/components/comments-section';
import ComplimentForm from '@/components/compliment-form';
import RecipeScaleSlider from '@/components/ui/recipe-scale-slider';
import RecipeImageGallery from '@/components/ui/recipe-image-gallery';
import { scaleIngredients, formatAsFraction } from '@/lib/recipe-scaling';
import ShareButton from '@/components/ui/share-button';

/**
 * StarRating Component for recipe detail page
 */
const StarRating = ({ 
  rating, 
  onRate, 
  interactive = true, 
  size = 'md',
  showCount = false,
  ratingCount = 0
}: { 
  rating: number; 
  onRate?: (rating: number) => void; 
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  ratingCount?: number;
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const currentRating = interactive ? (hoveredRating || rating) : rating;

  return (
    <div className="flex items-center space-x-2">
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= currentRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400 transition-colors' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-sm text-gray-600">
          {rating.toFixed(1)} ({ratingCount} review{ratingCount !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
};

/**
 * Loading Skeleton Component
 */
const RecipeDetailSkeleton = () => (
  <div className="min-h-screen">
    <nav className="bg-blue-100 shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="ml-3 w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </nav>
    
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="w-full h-8 bg-gray-200 rounded animate-pulse mb-6"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="w-full h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-2">
            <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="w-full h-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-full h-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Error Display Component
 */
const ErrorDisplay = ({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry: () => void; 
}) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="max-w-md w-full mx-4">
      <div className="bg-blue-100 rounded-lg shadow-md p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Recipe Not Found</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={onRetry}
            className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Main Recipe Detail Page Component
 */
export default function RecipeDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const recipeId = params.id as string;

  // State management
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  
  // Use favorites hook
  const { isFavorited, toggleFavorite } = useFavorites();
  
  // Comments state
  const [newComment, setNewComment] = useState<any>(null);
  
  // Compliment modal state
  const [showComplimentModal, setShowComplimentModal] = useState(false);
  
  // Recipe scaling state (local only, not persisted)
  const [recipeScale, setRecipeScale] = useState(1);
  
  // Calculate scaled ingredients when scale or recipe changes
  const scaledIngredients = useMemo(() => {
    if (!recipe) return [];
    return scaleIngredients(recipe.ingredients, recipeScale);
  }, [recipe?.ingredients, recipeScale]);

  /**
   * Fetches recipe data from the API
   */
  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getRecipe(recipeId);
      
      if (response.success && response.data) {
        setRecipe(response.data);
        setAvgRating(response.data.avgRating || 0);
        setRatingCount(response.data._count?.ratings || 0);
      } else {
        throw new Error(response.error || 'Recipe not found');
      }
    } catch (err) {
      console.error('Failed to fetch recipe:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches user's rating for this recipe
   */
  const fetchUserRating = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/recipes/${recipeId}/rating`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserRating(data.data.userRating);
          setAvgRating(data.data.recipeStats.averageRating);
          setRatingCount(data.data.recipeStats.ratingCount);
        } else {
          // API returned error but request succeeded
          console.warn('Rating API returned error:', data.error);
        }
      } else {
        // HTTP error response
        console.warn('Rating API request failed:', response.status, response.statusText);
      }
    } catch (err) {
      // Network or other error - silently fail for better UX
      console.warn('Rating data unavailable (network error):', err instanceof Error ? err.message : err);
      // Set default values so UI still works
      setUserRating(0);
      setAvgRating(0);
      setRatingCount(0);
    }
  };

  // Fetch recipe on component mount
  useEffect(() => {
    if (recipeId) {
      fetchRecipe();
    }
  }, [recipeId]);

  // Fetch user rating when session is available
  useEffect(() => {
    if (recipeId && session?.user?.id) {
      fetchUserRating();
    }
  }, [recipeId, session?.user?.id]);

  /**
   * Handles user rating submission
   */
  const handleRating = async (rating: number) => {
    if (!session?.user?.id) {
      alert('Please sign in to rate recipes');
      return;
    }

    try {
      setRatingLoading(true);
      
      const response = await fetch(`/api/recipes/${recipeId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserRating(data.data.rating);
          setAvgRating(data.data.recipeStats.averageRating);
          setRatingCount(data.data.recipeStats.ratingCount);
        } else {
          throw new Error(data.error || 'Failed to submit rating');
        }
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.warn('Rating submission failed:', error);
      
      // Check if it's a network/database connectivity issue
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('500')) {
        alert('Rating service is temporarily unavailable. Please try again later.');
      } else {
        alert('Failed to submit rating. Please try again.');
      }
    } finally {
      setRatingLoading(false);
    }
  };

  /**
   * Handles favorite toggle
   */
  const handleFavorite = async () => {
    await toggleFavorite(recipeId);
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
   * Handles print functionality
   */
  const handlePrint = () => {
    window.print();
  };

  // Share functionality is now handled by ShareButton component

  // Loading state
  if (loading) {
    return <RecipeDetailSkeleton />;
  }

  // Error state
  if (error || !recipe) {
    return (
      <ErrorDisplay 
        message={error || 'Recipe not found'} 
        onRetry={fetchRecipe} 
      />
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-blue-100 shadow-sm border-b print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Recipes
            </Link>
            
            <div className="flex items-center space-x-3">
              {/* Compliment Chef button - only show if user is not the recipe author */}
              {session?.user?.id && session.user.id !== recipe.authorId && (
                <button
                  onClick={() => setShowComplimentModal(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  title="Compliments to the Chef"
                >
                  <Coins className="w-4 h-4" />
                  <span className="font-serif italic">Compliments to the chef</span>
                </button>
              )}
              
              {/* Edit button - only show if user is the recipe author */}
              {session?.user?.id === recipe.authorId && (
                <Link
                  href={`/recipes/${recipeId}/edit`}
                  className="flex items-center space-x-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </Link>
              )}
              
              <button
                onClick={handlePrint}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Print Recipe"
              >
                <Printer className="w-5 h-5" />
              </button>
              <ShareButton
                title={recipe.title}
                text={recipe.description || `Check out this ${recipe.title} recipe!`}
                url={typeof window !== 'undefined' ? window.location.href : ''}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Recipe Content with Background Image */}
        <div className="relative">
          {/* Background Image Section */}
          <div 
            className="relative rounded-xl overflow-hidden mb-8"
            style={{
              backgroundImage: (() => {
                // Get primary image from images array, or first image if no primary
                const primaryImage = recipe.images?.find(img => img.isPrimary) || recipe.images?.[0];
                const imageUrl = primaryImage?.url;
                
                return imageUrl && getOptimizedImageUrl(imageUrl)
                  ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${getOptimizedImageUrl(imageUrl)})`
                  : 'linear-gradient(135deg, #065f46 0%, #047857 100%)';
              })(),
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Content Overlay */}
            <div className="relative p-6 flex flex-col min-h-[60vh]">
              {/* Recipe Header Content */}
              <div className="flex-1 flex flex-col justify-center text-white pb-8">
                <div className="max-w-4xl">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white drop-shadow-lg">
                    {recipe.title}
                  </h1>
                  
                  {recipe.description && (
                    <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-3xl drop-shadow">
                      {recipe.description}
                    </p>
                  )}

                  {/* Recipe Meta Info */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-white/80 mb-8">
                    <div className="flex items-center bg-black/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <User className="w-4 h-4 mr-2" />
                      <span>By {recipe.author.name}</span>
                    </div>
                    <div className="flex items-center bg-black/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Created {formatDate(recipe.createdAt)}</span>
                    </div>
                  </div>

                  {/* Rating and Favorite */}
                  <div className="flex items-center justify-between bg-black/30 backdrop-blur-sm rounded-lg p-6 max-w-4xl">
                    <div className="flex items-center space-x-6">
                      {session?.user?.id && (
                        <div>
                          <p className="text-sm text-white/90 mb-2">
                            {userRating > 0 ? 'Your rating:' : 'Rate this recipe:'}
                          </p>
                          <div className="flex items-center space-x-2">
                            <StarRating
                              rating={userRating}
                              onRate={handleRating}
                              size="lg"
                            />
                            {ratingLoading && <span className="text-sm text-white/70">Saving...</span>}
                          </div>
                        </div>
                      )}
                      
                      {session?.user?.id && <div className="h-12 w-px bg-white/20"></div>}
                      
                      <div>
                        <p className="text-sm text-white/90 mb-2">Average rating:</p>
                        <StarRating
                          rating={avgRating}
                          interactive={false}
                          showCount={true}
                          ratingCount={ratingCount}
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleFavorite}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors backdrop-blur-sm ${
                        isFavorited(recipeId) 
                          ? 'bg-red-600/80 text-white hover:bg-red-600/90' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isFavorited(recipeId) ? 'fill-white' : ''}`} />
                      <span>{isFavorited(recipeId) ? 'Favorited' : 'Add to Favorites'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Components Row */}
              <div>
                {/* Horizontal Components Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Recipe Quick Info */}
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <ChefHat className="w-4 h-4 mr-2" />
                    Recipe Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    {recipe.cookTime && (
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 text-gray-400 mr-2" />
                        <span className="text-gray-600">{recipe.cookTime}</span>
                      </div>
                    )}
                    
                    {recipe.servings && (
                      <div className="flex items-center">
                        <Users className="w-3 h-3 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          {Math.round(recipe.servings * recipeScale)} servings
                          {recipeScale !== 1 && (
                            <span className="ml-1 text-xs text-green-700">
                              (scaled {recipeScale}x)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <span className="text-gray-600 capitalize">{recipe.difficulty}</span>
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Ingredients ({recipe.ingredients?.length || 0})
                    {recipeScale !== 1 && (
                      <span className="ml-1 text-xs font-normal text-green-700">
                        ({recipeScale}x)
                      </span>
                    )}
                  </h3>
                  <div className="max-h-32 overflow-y-auto">
                    <ol className="space-y-1 text-xs">
                      {scaledIngredients?.slice(0, 6).map((ingredient, index) => (
                        <li key={ingredient.id || index} className="flex items-start">
                          <span className="min-w-4 h-4 bg-green-700 text-white text-xs font-medium rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span className="text-gray-700 leading-tight">
                            {ingredient.amount !== undefined && ingredient.amount > 0 ? `${formatAsFraction(ingredient.amount)} ` : ''}{ingredient.unit ? `${ingredient.unit} ` : ''}{ingredient.ingredient}
                          </span>
                        </li>
                      )) || (
                        <li className="text-gray-500 italic">No ingredients listed</li>
                      )}
                      {scaledIngredients && scaledIngredients.length > 6 && (
                        <li className="text-gray-500 italic text-xs">
                          +{scaledIngredients.length - 6} more ingredients...
                        </li>
                      )}
                    </ol>
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-1">
                    {recipe.tags.length > 0 ? (
                      recipe.tags.slice(0, 4).map((tag, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 italic text-xs">No tags</span>
                    )}
                    {recipe.tags.length > 4 && (
                      <span className="text-gray-500 italic text-xs">
                        +{recipe.tags.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Recipe Scale Control */}
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Scale Recipe</h3>
                  <div className="space-y-2">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-700">
                        {recipeScale === 1 ? '1x (Original)' : `${recipeScale}x`}
                      </div>
                      {recipeScale !== 1 && recipe.servings && (
                        <div className="text-xs text-gray-600">
                          {Math.round(recipe.servings * recipeScale)} servings
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setRecipeScale(Math.max(0.25, recipeScale - 0.25))}
                        disabled={recipeScale <= 0.25}
                        className="w-6 h-6 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      
                      <div className="flex-1 flex justify-center space-x-1">
                        {[0.5, 1, 2].map(preset => (
                          <button
                            key={preset}
                            onClick={() => setRecipeScale(preset)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              Math.abs(recipeScale - preset) < 0.01
                                ? 'bg-green-700 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {preset}x
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setRecipeScale(Math.min(10, recipeScale + 0.25))}
                        disabled={recipeScale >= 10}
                        className="w-6 h-6 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Sections Below */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Instructions (Main Content) */}
          <div className="lg:col-span-2">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Instructions</h2>
              <div className="bg-blue-100 rounded-lg p-6 shadow-sm">
                <div className="prose max-w-none">
                  {recipe.instructions.split('\n').map((step, index) => (
                    <p key={index} className="mb-4 leading-relaxed text-gray-800">
                      {step.trim() && step.trim()}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Detailed Sidebar */}
          <div className="space-y-6">
            {/* Full Ingredients List */}
            <div className="bg-blue-100 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Complete Ingredients List
                {recipeScale !== 1 && (
                  <span className="ml-2 text-sm font-normal text-green-700">
                    (scaled {recipeScale}x)
                  </span>
                )}
              </h3>
              <ol className="space-y-2">
                {scaledIngredients?.map((ingredient, index) => (
                  <li key={ingredient.id || index} className="flex items-start">
                    <span className="min-w-6 h-6 bg-green-700 text-white text-sm font-medium rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">
                      {ingredient.amount !== undefined && ingredient.amount > 0 ? `${formatAsFraction(ingredient.amount)} ` : ''}{ingredient.unit ? `${ingredient.unit} ` : ''}{ingredient.ingredient}
                    </span>
                  </li>
                )) || (
                  <li className="text-gray-500 italic">No ingredients listed</li>
                )}
              </ol>
            </div>

          </div>
        </div>

        {/* Recipe Image Gallery */}
        <div className="mt-12 mb-12">
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Recipe Photos</h2>
            <div className="relative group ml-2">
              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Click on photos to see full size image
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          </div>
          <RecipeImageGallery
            images={recipe.images || []}
            recipeTitle={recipe.title}
            className="w-full"
          />
        </div>

        {/* Comments Section */}
        <div className="mt-12 space-y-6">
          <CommentForm 
            recipeId={recipeId}
            onCommentCreated={setNewComment}
          />
          
          <CommentsSection 
            recipeId={recipeId}
            recipeAuthorId={recipe.authorId}
            newComment={newComment}
          />
        </div>
      </div>
      
      {/* Compliment Modal */}
      <ComplimentForm
        isOpen={showComplimentModal}
        onClose={() => setShowComplimentModal(false)}
        toUserId={recipe.authorId}
        toUserName={recipe.author.name}
        recipe={{
          id: recipe.id,
          title: recipe.title
        }}
        onComplimentSent={() => {
          // Could add a success notification here
          console.log('Compliment sent successfully!');
        }}
      />
    </div>
  );
}