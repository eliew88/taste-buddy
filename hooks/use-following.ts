import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface FollowStatus {
  followingCount: number;
  followersCount: number;
  isFollowing: boolean;
  canFollow: boolean;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  followedAt?: Date;
}

export function useFollowing() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const followUser = useCallback(async (userId: string) => {
    if (!session?.user?.id) {
      setError('You must be logged in to follow users');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'follow'
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to follow user');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to follow user';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const unfollowUser = useCallback(async (userId: string) => {
    if (!session?.user?.id) {
      setError('You must be logged in to unfollow users');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'unfollow'
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to unfollow user');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unfollow user';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const getFollowStatus = useCallback(async (userId: string): Promise<FollowStatus | null> => {
    if (!session?.user?.id) return null;

    try {
      const response = await fetch(`/api/users/${userId}/follow-status`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get follow status');
      }

      return data.data;
    } catch (err) {
      console.error('Error getting follow status:', err);
      return null;
    }
  }, [session?.user?.id]);

  const getFollowing = useCallback(async (userId: string): Promise<User[]> => {
    if (!session?.user?.id) return [];

    try {
      const response = await fetch(`/api/users/${userId}/following`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get following list');
      }

      return data.data;
    } catch (err) {
      console.error('Error getting following list:', err);
      return [];
    }
  }, [session?.user?.id]);

  const getFollowers = useCallback(async (userId: string): Promise<User[]> => {
    if (!session?.user?.id) return [];

    try {
      const response = await fetch(`/api/users/${userId}/followers`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get followers list');
      }

      return data.data;
    } catch (err) {
      console.error('Error getting followers list:', err);
      return [];
    }
  }, [session?.user?.id]);

  // Temporary debugging
  console.log('useFollowing hook:', {
    session: !!session,
    userId: session?.user?.id,
    isAuthenticated: !!session?.user?.id,
    sessionStatus: session ? 'has session' : 'no session'
  });

  return {
    followUser,
    unfollowUser,
    getFollowStatus,
    getFollowing,
    getFollowers,
    loading,
    error,
    isAuthenticated: !!session?.user?.id
  };
}