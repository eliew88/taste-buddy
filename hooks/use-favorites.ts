/**
 * Custom hook for managing favorites functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface UseFavoritesReturn {
  favorites: Set<string>;
  isLoading: boolean;
  isFavorited: (recipeId: string) => boolean;
  toggleFavorite: (recipeId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useFavorites(): UseFavoritesReturn {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's favorites
  const fetchFavorites = useCallback(async () => {
    if (!session?.user) {
      setFavorites(new Set());
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/users/favorites');
      const data = await response.json();

      if (data.success) {
        const favoriteIds = new Set<string>(data.data.map((recipe: {id: string}) => recipe.id));
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.warn('Favorites data unavailable:', error instanceof Error ? error.message : error);
      // Set empty set so UI still works
      setFavorites(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  // Fetch favorites when session changes
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Check if a recipe is favorited
  const isFavorited = useCallback((recipeId: string): boolean => {
    return favorites.has(recipeId);
  }, [favorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (recipeId: string): Promise<boolean> => {
    if (!session?.user) {
      console.log('Please sign in to favorite recipes');
      return false;
    }

    try {
      const response = await fetch('/api/recipes/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          recipeId,
          action: 'toggle'
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          if (data.data.isFavorited) {
            newFavorites.add(recipeId);
          } else {
            newFavorites.delete(recipeId);
          }
          return newFavorites;
        });
        return data.data.isFavorited;
      } else {
        throw new Error(data.error || 'Failed to update favorite');
      }
    } catch (error) {
      console.warn('Favorite toggle failed:', error instanceof Error ? error.message : error);
      // Show user-friendly message if it's a connectivity issue
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        console.log('Favorites service temporarily unavailable');
      }
      return favorites.has(recipeId); // Return current state on error
    }
  }, [session?.user, favorites]);

  return {
    favorites,
    isLoading,
    isFavorited,
    toggleFavorite,
    refetch: fetchFavorites
  };
}