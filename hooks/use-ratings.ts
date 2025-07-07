/**
 * Custom hook for managing recipe ratings functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface RecipeStats {
  averageRating: number;
  ratingCount: number;
}

interface UseRatingsReturn {
  userRating: number;
  recipeStats: RecipeStats;
  isLoading: boolean;
  submitRating: (rating: number) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useRatings(recipeId: string): UseRatingsReturn {
  const { data: session } = useSession();
  const [userRating, setUserRating] = useState<number>(0);
  const [recipeStats, setRecipeStats] = useState<RecipeStats>({
    averageRating: 0,
    ratingCount: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's rating and recipe stats
  const fetchRatingData = useCallback(async () => {
    if (!recipeId) return;

    try {
      setIsLoading(true);

      if (session?.user) {
        // Fetch user's rating for authenticated users
        const response = await fetch(`/api/recipes/${recipeId}/rating`);
        const data = await response.json();

        if (data.success) {
          setUserRating(data.data.userRating);
          setRecipeStats(data.data.recipeStats);
        } else {
          console.error('Error fetching rating data:', data.error);
        }
      } else {
        // For unauthenticated users, just get recipe stats
        const response = await fetch(`/api/recipes/${recipeId}/rating`);
        const data = await response.json();

        if (!response.ok) {
          // If not authenticated, we can still get public recipe stats
          // Let's use a simpler approach for now
          setUserRating(0);
          setRecipeStats({ averageRating: 0, ratingCount: 0 });
        } else if (data.success) {
          setUserRating(0); // No user rating for unauthenticated users
          setRecipeStats(data.data.recipeStats);
        }
      }
    } catch (error) {
      console.error('Error fetching rating data:', error);
      setUserRating(0);
      setRecipeStats({ averageRating: 0, ratingCount: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [recipeId, session?.user]);

  // Fetch rating data when recipe or session changes
  useEffect(() => {
    fetchRatingData();
  }, [fetchRatingData]);

  // Submit a rating
  const submitRating = useCallback(async (rating: number): Promise<boolean> => {
    if (!session?.user) {
      console.log('Please sign in to rate recipes');
      return false;
    }

    if (rating < 1 || rating > 5) {
      console.error('Rating must be between 1 and 5');
      return false;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`/api/recipes/${recipeId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state with new rating
        setUserRating(data.data.rating);
        setRecipeStats(data.data.recipeStats);
        return true;
      } else {
        console.error('Error submitting rating:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [recipeId, session?.user]);

  return {
    userRating,
    recipeStats,
    isLoading,
    submitRating,
    refetch: fetchRatingData
  };
}