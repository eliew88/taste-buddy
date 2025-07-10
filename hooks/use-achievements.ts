import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Achievement {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  threshold: number;
  isActive: boolean;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  earnedAt: Date;
  achievement: Achievement;
}

export function useUserAchievements(userId?: string) {
  const { data: session } = useSession();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || session?.user?.id;

  const fetchAchievements = useCallback(async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${targetUserId}/achievements`);
      const data = await response.json();

      if (data.success) {
        setAchievements(data.data);
      } else {
        setError(data.error || 'Failed to fetch achievements');
      }
    } catch (err) {
      setError('Failed to fetch achievements');
      console.error('Achievements fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  const evaluateAchievements = useCallback(async () => {
    if (!session?.user?.id || session.user.id !== targetUserId) {
      throw new Error('Can only evaluate own achievements');
    }

    try {
      const response = await fetch(`/api/users/${targetUserId}/achievements`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        // Refresh achievements list
        await fetchAchievements();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to evaluate achievements');
      }
    } catch (err) {
      console.error('Achievement evaluation error:', err);
      throw err;
    }
  }, [session?.user?.id, targetUserId, fetchAchievements]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return {
    achievements,
    loading,
    error,
    refetch: fetchAchievements,
    evaluateAchievements
  };
}

export function useAchievementEvaluation() {
  const { data: session } = useSession();
  const [evaluating, setEvaluating] = useState(false);

  const evaluateUserAchievements = useCallback(async () => {
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    try {
      setEvaluating(true);
      const response = await fetch(`/api/users/${session.user.id}/achievements`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to evaluate achievements');
      }
    } catch (err) {
      console.error('Achievement evaluation error:', err);
      throw err;
    } finally {
      setEvaluating(false);
    }
  }, [session?.user?.id]);

  return {
    evaluateUserAchievements,
    evaluating
  };
}