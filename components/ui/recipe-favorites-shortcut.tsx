/**
 * Recipe Favorites Shortcut Component
 * 
 * Provides a quick red heart toggle for adding/removing recipes from the 
 * "Favorites" category in the user's Recipe Book. This is a convenience
 * shortcut that doesn't interact with the legacy favorites system.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Heart, Loader2 } from 'lucide-react';
import { useRecipeBook } from '@/hooks/use-recipe-book';

interface RecipeFavoritesShortcutProps {
  recipeId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  onStatusChange?: () => void; // Callback to notify parent when status changes
  refreshTrigger?: number; // Used to force refresh when external changes occur
}

export default function RecipeFavoritesShortcut({ 
  recipeId, 
  className = '',
  size = 'md',
  showTooltip = true,
  onStatusChange,
  refreshTrigger
}: RecipeFavoritesShortcutProps) {
  const { data: session } = useSession();
  const {
    categories,
    loading: recipeBooksLoading,
    getRecipeBookStatus,
    addToRecipeBook,
    updateRecipeCategories,
    removeFromRecipeBook
  } = useRecipeBook();

  const [isInFavorites, setIsInFavorites] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favoritesCategory, setFavoritesCategory] = useState<{ id: string; name: string } | null>(null);

  // Get size classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  // Find favorites category and check if recipe is in it
  useEffect(() => {
    const checkFavoritesStatus = async () => {
      if (!session?.user?.id || recipeBooksLoading) return;

      // Find the Favorites category
      const favCategory = categories.find(cat => cat.name === 'Favorites');
      setFavoritesCategory(favCategory || null);

      if (favCategory) {
        // Check if recipe is in favorites category
        const status = await getRecipeBookStatus(recipeId);
        const isInFavs = status.categories.some(cat => cat.id === favCategory.id);
        setIsInFavorites(isInFavs);
      }
    };

    checkFavoritesStatus();
  }, [session?.user?.id, recipeBooksLoading, categories, recipeId, getRecipeBookStatus, refreshTrigger]);

  const handleToggleFavorites = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user?.id || !favoritesCategory) {
      console.log('Please sign in to favorite recipes');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      if (isInFavorites) {
        // Remove from favorites - get current status and remove only favorites category
        const currentStatus = await getRecipeBookStatus(recipeId);
        const otherCategoryIds = currentStatus.categories
          .filter(cat => cat.id !== favoritesCategory.id)
          .map(cat => cat.id);

        if (otherCategoryIds.length > 0) {
          // Recipe is in other categories, just remove from favorites
          await updateRecipeCategories(recipeId, otherCategoryIds, currentStatus.notes);
        } else {
          // Recipe is only in favorites, remove completely
          await removeFromRecipeBook(recipeId);
        }
        setIsInFavorites(false);
      } else {
        // Add to favorites - get current status and add favorites category
        const currentStatus = await getRecipeBookStatus(recipeId);
        const currentCategoryIds = currentStatus.categories.map(cat => cat.id);
        const newCategoryIds = [...currentCategoryIds, favoritesCategory.id];

        if (currentStatus.inBook) {
          // Recipe is already in book, update categories
          await updateRecipeCategories(recipeId, newCategoryIds, currentStatus.notes);
        } else {
          // Recipe is not in book, add it
          await addToRecipeBook(recipeId, newCategoryIds, currentStatus.notes);
        }
        setIsInFavorites(true);
      }
      
      // Notify parent component that recipe book status has changed
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error toggling favorites:', error);
      alert(error instanceof Error ? error.message : 'Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user is not authenticated or no favorites category exists
  if (!session?.user?.id || !favoritesCategory) {
    return null;
  }

  const tooltipText = isInFavorites 
    ? 'Remove from Favorites' 
    : 'Add to Favorites';

  return (
    <button
      onClick={handleToggleFavorites}
      disabled={loading}
      className={`${buttonSizeClasses[size]} rounded-full transition-all duration-200 ${
        isInFavorites 
          ? 'text-red-500 bg-red-50 hover:bg-red-100' 
          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
      } disabled:opacity-50 ${className}`}
      aria-label={tooltipText}
      title={showTooltip ? tooltipText : undefined}
    >
      {loading ? (
        <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      ) : (
        <Heart 
          className={`${sizeClasses[size]} ${
            isInFavorites ? 'fill-red-500' : ''
          }`} 
        />
      )}
    </button>
  );
}