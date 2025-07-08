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

import { useState, useEffect } from 'react';
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
  Edit
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Recipe } from '@/types/recipe';
import { useFavorites } from '@/hooks/use-favorites';

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
  <div className="min-h-screen bg-gray-50">
    <nav className="bg-white shadow-sm border-b">
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
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="max-w-md w-full mx-4">
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
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
  
  // Use favorites hook
  const { isFavorited, toggleFavorite } = useFavorites();

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

  // Fetch recipe on component mount
  useEffect(() => {
    if (recipeId) {
      fetchRecipe();
    }
  }, [recipeId]);

  /**
   * Handles user rating submission
   */
  const handleRating = async (rating: number) => {
    try {
      setUserRating(rating);
      // TODO: Implement API call when rating endpoint is ready
      // await apiClient.rateRecipe(recipeId, rating);
      console.log('Rating submitted:', rating);
    } catch (error) {
      console.error('Failed to submit rating:', error);
      // Revert rating on error
      setUserRating(0);
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

  /**
   * Handles share functionality
   */
  const handleShare = async () => {
    const shareData = {
      title: recipe?.title || 'Recipe',
      text: recipe?.description || 'Check out this recipe!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Recipe link copied to clipboard!');
    }
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b print:hidden">
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
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Share Recipe"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Recipe Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {recipe.title}
          </h1>
          
          {recipe.description && (
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              {recipe.description}
            </p>
          )}

          {/* Recipe Meta Info */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span>By {recipe.author.name}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Created {formatDate(recipe.createdAt)}</span>
            </div>
          </div>

          {/* Rating and Favorite */}
          <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rate this recipe:</p>
                <StarRating
                  rating={userRating}
                  onRate={handleRating}
                  size="lg"
                />
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Average rating:</p>
                <StarRating
                  rating={recipe.avgRating || 0}
                  interactive={false}
                  showCount={true}
                  ratingCount={recipe._count?.ratings || 0}
                />
              </div>
            </div>
            
            <button
              onClick={handleFavorite}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isFavorited(recipeId) 
                  ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorited(recipeId) ? 'fill-red-600' : ''}`} />
              <span>{isFavorited(recipeId) ? 'Favorited' : 'Add to Favorites'}</span>
            </button>
          </div>
        </header>

        {/* Recipe Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Instructions) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recipe Image */}
            {recipe.image && (
              <div className="aspect-video rounded-lg overflow-hidden shadow-md">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Instructions */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Instructions</h2>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="prose max-w-none">
                  {recipe.instructions.split('\n').map((step, index) => (
                    <p key={index} className="mb-4 leading-relaxed">
                      {step.trim() && (
                        <>
                          <span className="font-semibold text-green-700">
                            {index + 1}.
                          </span>{' '}
                          {step.trim()}
                        </>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recipe Quick Info */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipe Info</h3>
              <div className="space-y-3">
                {recipe.cookTime && (
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Cook Time</p>
                      <p className="font-medium">{recipe.cookTime}</p>
                    </div>
                  </div>
                )}
                
                {recipe.servings && (
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Servings</p>
                      <p className="font-medium">{recipe.servings}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <ChefHat className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Difficulty</p>
                    <p className="font-medium capitalize">{recipe.difficulty}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ingredients ({recipe.ingredients.length})
              </h3>
              <ol className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <span className="min-w-6 h-6 bg-green-700 text-white text-sm font-medium rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tags */}
            {recipe.tags.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}