'use client';

import { useState, useEffect } from 'react';
import { useFollowing } from '@/hooks/use-following';
import { useGlobalAchievements } from '@/components/providers/achievement-provider';

interface FollowButtonProps {
  userId: string;
  className?: string;
  variant?: 'default' | 'compact';
}

export function FollowButton({ userId, className = '', variant = 'default' }: FollowButtonProps) {
  const { getFollowStatus, loading: hookLoading, error, isAuthenticated } = useFollowing();
  const { showAchievements } = useGlobalAchievements();
  const [isFollowing, setIsFollowing] = useState(false);
  const [canFollow, setCanFollow] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!isAuthenticated) {
        setStatusLoading(false);
        return;
      }

      const status = await getFollowStatus(userId);
      if (status) {
        setIsFollowing(status.isFollowing);
        setCanFollow(status.canFollow);
      }
      setStatusLoading(false);
    };

    fetchStatus();
  }, [userId, isAuthenticated, getFollowStatus]);

  const handleClick = async () => {
    if (!isAuthenticated || !canFollow) return;

    setLoading(true);
    
    try {
      const response = await fetch('/api/users/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: isFollowing ? 'unfollow' : 'follow'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsFollowing(!isFollowing);
        
        // Show achievement notifications if any were earned
        if (data.newAchievements && data.newAchievements.length > 0) {
          console.log('🏆 Follow action unlocked achievements:', data.newAchievements.map((a: any) => a.achievement.name));
          showAchievements(data.newAchievements);
        }
      } else {
        console.error('Follow action failed:', data.error);
      }
    } catch (error) {
      console.error('Follow action error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !canFollow || statusLoading) {
    return null;
  }

  const baseClasses = "font-medium transition-colors disabled:opacity-50";
  const sizeClasses = variant === 'compact' 
    ? "px-3 py-1 text-sm"
    : "px-4 py-2";
  
  const variantClasses = isFollowing
    ? "bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-300"
    : "bg-purple-600 text-white hover:bg-purple-700";

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} rounded-lg ${className}`}
    >
      {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}