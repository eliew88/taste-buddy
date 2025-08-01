/**
 * Recipe Card Component
 * 
 * Displays a recipe in card format with key information, actions, and navigation.
 * Used in recipe listings, search results, and recommendation sections.
 */

 'use client';

 import Link from 'next/link';
 import { useState, useEffect } from 'react';
 import { useSession } from 'next-auth/react';
 import { Heart, Clock, Users, ChefHat, Eye, Loader2, Lock } from 'lucide-react';
 import StarRating from './star-rating';
 import { FollowButton } from './follow-button';
import RecipeBookButton from './recipe-book-button';
 import { Recipe } from '@/types/recipe';
 import { truncateText } from '@/lib/utils';
 import { useRatings } from '@/hooks/use-ratings';
 import { getOptimizedImageUrl } from '@/lib/image-client-utils';
import Avatar from '@/components/ui/avatar';
 
 interface RecipeCardProps {
   /** Recipe data to display */
   recipe: Recipe;
   
   /** Additional CSS classes */
   className?: string;
   
   /** Whether to show the full description */
   showFullDescription?: boolean;
  
  /** Whether to show the favorite button */
  showFavoriteButton?: boolean;
  
  /** Whether the recipe is currently favorited */
  isFavorited?: boolean;
  
  /** Callback when favorite status changes */
  onFavoriteToggle?: (recipeId: string) => Promise<void>;
  
  /** Whether to show recipe book status badge */
  showRecipeBookStatus?: boolean;
  
  /** Recipe book status (categories this recipe is in) */
  recipeBookCategories?: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  
  /** Whether to show the follow button */
  showFollowButton?: boolean;
  
  /** Whether to show the recipe book button */
  showRecipeBookButton?: boolean;
}
 
 /**
  * RecipeCard Component
  * 
  * Features:
  * - Recipe image with fallback
  * - Title with link to detail page
  * - Author information
  * - Description with truncation
  * - Recipe metadata (time, servings, difficulty)
  * - Interactive favorite button
  * - Star rating with user interaction
  * - Tag display
  * - Responsive design
  */
 export default function RecipeCard({ 
   recipe, 
   className = '',
   showFullDescription = false,
  showFavoriteButton = true,
  isFavorited = false,
  onFavoriteToggle,
  showRecipeBookStatus = false,
  recipeBookCategories = [],
  showFollowButton = true,
  showRecipeBookButton = false
 }: RecipeCardProps) {
   const { data: session } = useSession();
  
  // Use ratings hook for persistent rating functionality
   const { userRating, recipeStats, submitRating } = useRatings(recipe.id);
  
  // Local state for user interactions
   const [isFavorite, setIsFavorite] = useState(isFavorited);
   const [isLoading, setIsLoading] = useState(false);
   const [imageError, setImageError] = useState(false);
  
  // Update local state when props change
  useEffect(() => {
    setIsFavorite(isFavorited);
  }, [isFavorited]);

  // Reset image error when recipe changes
  useEffect(() => {
    setImageError(false);
  }, [recipe.id]);
 
   /**
    * Handles favorite toggle
    */
   const handleFavorite = async (e: React.MouseEvent) => {
     e.preventDefault();
     e.stopPropagation();
     
     // Prevent double clicks
     if (isLoading) {
       return;
     }
     
     // Check if user is authenticated
     if (!session?.user) {
       console.log('Please sign in to favorite recipes');
       return;
     }
     
     if (onFavoriteToggle) {
       setIsLoading(true);
       try {
         await onFavoriteToggle(recipe.id);
       } finally {
         setIsLoading(false);
       }
     }
   };
 
   /**
    * Handles rating submission with persistent storage
    * 
    * @param rating - New rating value (1-5)
    */
   const handleRating = async (rating: number) => {
     if (!session?.user) {
       console.log('Please sign in to rate recipes');
       return;
     }

     try {
       const success = await submitRating(rating);
       if (success) {
         console.log(`Successfully rated recipe "${recipe.title}" with ${rating} stars`);
       } else {
         console.error('Failed to submit rating');
       }
     } catch (error) {
       console.error('Error submitting rating:', error);
     }
   };
 
   /**
    * Gets the difficulty badge color
    * @param difficulty - Recipe difficulty level
    * @returns CSS classes for the difficulty badge
    */
   const getDifficultyColor = (difficulty: string) => {
     switch (difficulty) {
       case 'easy': return 'bg-green-100 text-green-800';
       case 'medium': return 'bg-yellow-100 text-yellow-800';
       case 'hard': return 'bg-red-100 text-red-800';
       default: return 'bg-gray-100 text-gray-800';
     }
   };
 
   return (
     <article 
       className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 ${className}`}
       aria-label={`Recipe: ${recipe.title}`}
     >
       {/* Recipe Image */}
       <Link href={`/recipes/${recipe.id}`} className="block">
         <div className="h-48 bg-gray-200 overflow-hidden relative group cursor-pointer">
           {(() => {
             // Get primary image from images array, or first image if no primary
             const primaryImage = recipe.images?.find(img => img.isPrimary) || recipe.images?.[0];
             const imageUrl = primaryImage?.url;
             
             return imageUrl && !imageError && getOptimizedImageUrl(imageUrl) ? (
               <img 
                 src={getOptimizedImageUrl(imageUrl)!} 
                 alt={primaryImage?.alt || `${recipe.title} recipe`}
                 className="w-full h-full object-cover transition-transform group-hover:scale-105"
                 loading="lazy"
                 onError={() => {
                   // If B2 image fails, show placeholder immediately
                   setImageError(true);
                 }}
               />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                 <div className="text-center text-gray-400">
                   <ChefHat className="w-16 h-16 mx-auto mb-2 opacity-50" />
                   <p className="text-sm font-medium">No image</p>
                 </div>
               </div>
             );
           })()}
         </div>
       </Link>
       
       <div className="p-6">
         {/* Header with title and favorite button */}
         <header className="flex justify-between items-start mb-4">
           <Link href={`/recipes/${recipe.id}`} className="flex-1 group">
             <div className="flex items-center space-x-2">
               <h3 className="text-xl font-semibold text-gray-800 group-hover:text-green-700 transition-colors line-clamp-2">
                 {recipe.title}
               </h3>
               {/* Privacy indicator - only show to recipe author */}
               {!recipe.isPublic && session?.user?.id === recipe.author.id && (
                 <div className="flex-shrink-0">
                   <div 
                     className="flex items-center bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
                     title="This recipe is private and only visible to you"
                   >
                     <Lock className="w-3 h-3 mr-1" />
                     Private
                   </div>
                 </div>
               )}
               
               {/* Recipe Book Status - show categories this recipe is in */}
               {showRecipeBookStatus && recipeBookCategories.length > 0 && (
                 <div className="flex-shrink-0">
                   <div className="flex flex-wrap gap-1">
                     {recipeBookCategories.slice(0, 2).map((category) => (
                       <div 
                         key={category.id}
                         className="flex items-center px-2 py-1 rounded-full text-xs text-white"
                         style={{ backgroundColor: category.color || '#3B82F6' }}
                         title={`In category: ${category.name}`}
                       >
                         {category.name}
                       </div>
                     ))}
                     {recipeBookCategories.length > 2 && (
                       <div 
                         className="flex items-center px-2 py-1 rounded-full text-xs bg-gray-500 text-white"
                         title={`And ${recipeBookCategories.length - 2} more categories`}
                       >
                         +{recipeBookCategories.length - 2}
                       </div>
                     )}
                   </div>
                 </div>
               )}
             </div>
           </Link>
           
           {showFavoriteButton && (
            <button
             onClick={handleFavorite}
             disabled={isLoading || !session?.user}
             className={`p-2 rounded-full flex-shrink-0 transition-all ${
               isFavorite 
                 ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                 : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
             } disabled:opacity-50`}
             aria-label={`${isFavorite ? 'Remove from' : 'Add to'} favorites`}
             title={!session?.user ? 'Sign in to favorite recipes' : ''}
           >
             {isLoading ? (
               <Loader2 className="w-5 h-5 animate-spin" />
             ) : (
               <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''}`} />
             )}
           </button>
          )}
          {showRecipeBookButton && (
            <RecipeBookButton 
              recipeId={recipe.id}
              variant="compact"
              showLabel={false}
            />
          )}
        </header>
         
         {/* Author with follow button */}
         <div className="flex items-center justify-between mb-3">
           <div className="flex items-center space-x-2">
             <Avatar
               imageUrl={recipe.author.image}
               name={recipe.author.name}
               size="sm"
             />
             <p className="text-gray-600">
               By <Link href={`/profile/${recipe.author.id}`} className="font-medium text-gray-800 hover:text-blue-600 transition-colors">
                 {recipe.author.name}
               </Link>
             </p>
           </div>
           {showFollowButton && (
             <FollowButton userId={recipe.author.id} variant="compact" />
           )}
         </div>
         
         {/* Description */}
         {recipe.description && (
           <p className="text-gray-700 text-sm mb-4">
             {showFullDescription 
               ? recipe.description 
               : truncateText(recipe.description, 120)
             }
           </p>
         )}
         
         {/* Recipe metadata */}
         <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
           {recipe.cookTime && (
             <div className="flex items-center" title="Cooking time">
               <Clock className="w-4 h-4 mr-1" />
               <span>{recipe.cookTime}</span>
             </div>
           )}
           
           {recipe.servings && (
             <div className="flex items-center" title="Number of servings">
               <Users className="w-4 h-4 mr-1" />
               <span>{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
             </div>
           )}
           
           <div className="flex items-center" title="Difficulty level">
             <ChefHat className="w-4 h-4 mr-1" />
             <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
               {recipe.difficulty}
             </span>
           </div>
         </div>
         
         {/* Tags */}
         {recipe.tags.length > 0 && (
           <div className="mb-4">
             <div className="flex flex-wrap gap-2">
               {recipe.tags.slice(0, 3).map((tag, index) => (
                 <span
                   key={index}
                   className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                 >
                   {tag}
                 </span>
               ))}
               {recipe.tags.length > 3 && (
                 <span className="text-gray-500 text-xs py-1">
                   +{recipe.tags.length - 3} more
                 </span>
               )}
             </div>
           </div>
         )}
         
         {/* Footer with rating and stats */}
         <footer className="flex justify-between items-center pt-2 border-t border-gray-100">
           <div className="flex items-center space-x-2">
             <StarRating 
               rating={userRating} 
               onRate={handleRating}
               size="sm"
             />
             <span className="text-sm text-gray-600">
               {recipeStats.averageRating?.toFixed(1) || '0.0'} ({recipeStats.ratingCount || 0})
             </span>
           </div>
           
           <div className="flex items-center space-x-3">
             {/* Recipe Book saves count */}
             <div className="flex items-center text-sm text-gray-500">
               <Heart className="w-3 h-3 mr-1" />
               <span>{recipe._count?.recipeBookEntries || 0} saves</span>
             </div>
           </div>
         </footer>
       </div>
     </article>
   );
 }