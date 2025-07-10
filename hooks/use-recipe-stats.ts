import { useState, useEffect } from 'react';
import { Recipe } from '@/types/recipe';

export interface RecipeStats {
  mostPopular: Recipe[];
  newest: Recipe[];
  highestRated: (Recipe & { avgRating: number })[];
  platformStats: {
    totalRecipes: number;
    totalUsers: number;
    totalFavorites: number;
    totalRatings: number;
  };
  trendingTags: { tag: string; count: number }[];
}

export function useRecipeStats() {
  const [stats, setStats] = useState<RecipeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/recipes/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || 'Failed to fetch recipe statistics');
      }
    } catch (err) {
      setError('Failed to fetch recipe statistics');
      console.error('Recipe stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}