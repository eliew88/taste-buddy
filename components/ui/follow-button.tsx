'use client';

import { useState, useEffect } from 'react';
import { useFollowing } from '@/hooks/use-following';

interface FollowButtonProps {
  userId: string;
  className?: string;
  variant?: 'default' | 'compact';
}

export function FollowButton({ userId, className = '', variant = 'default' }: FollowButtonProps) {
  const { followUser, unfollowUser, getFollowStatus, loading, error, isAuthenticated } = useFollowing();
  const [isFollowing, setIsFollowing] = useState(false);
  const [canFollow, setCanFollow] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

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

    const success = isFollowing 
      ? await unfollowUser(userId)
      : await followUser(userId);

    if (success) {
      setIsFollowing(!isFollowing);
    }
  };

  // Temporary debugging for production
  console.log('FollowButton render check:', {
    userId,
    isAuthenticated,
    canFollow,
    statusLoading,
    isFollowing,
    loading,
    error
  });

  if (!isAuthenticated) {
    return (
      <div className="text-xs text-gray-500 px-2 py-1 border border-gray-200 rounded">
        Sign in to follow
      </div>
    );
  }

  if (statusLoading) {
    return (
      <div className="text-xs text-gray-500 px-2 py-1 border border-gray-200 rounded">
        Loading...
      </div>
    );
  }

  if (!canFollow) {
    return (
      <div className="text-xs text-gray-500 px-2 py-1 border border-gray-200 rounded">
        Own recipe
      </div>
    );
  }

  const baseClasses = "font-medium transition-colors disabled:opacity-50";
  const sizeClasses = variant === 'compact' 
    ? "px-3 py-1 text-sm"
    : "px-4 py-2";
  
  const variantClasses = isFollowing
    ? "bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-300"
    : "bg-blue-500 text-white hover:bg-blue-600";

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