/**
 * Custom hook for managing comments state
 * 
 * Provides a centralized way to handle comments data fetching,
 * creation, and state management across components
 */

import { useState, useEffect, useCallback } from 'react';
import { Comment } from '@/types/recipe';

interface UseCommentsOptions {
  recipeId: string;
  autoFetch?: boolean;
}

interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  fetchComments: () => Promise<void>;
  addComment: (comment: Comment) => void;
  createComment: (content: string, visibility: 'private' | 'author_only' | 'public') => Promise<Comment>;
  refresh: () => Promise<void>;
}

export function useComments({ 
  recipeId, 
  autoFetch = true 
}: UseCommentsOptions): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!recipeId) return;
    
    try {
      setError(null);
      setLoading(true);
      
      const response = await fetch(`/api/comments?recipeId=${recipeId}`);
      const data = await response.json();

      if (data.success) {
        setComments(data.data);
      } else {
        setError(data.error || 'Failed to load comments');
      }
    } catch (err) {
      setError('Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  const addComment = useCallback((comment: Comment) => {
    setComments(prev => [comment, ...prev]);
  }, []);

  const createComment = useCallback(async (
    content: string, 
    visibility: 'private' | 'author_only' | 'public'
  ): Promise<Comment> => {
    if (!recipeId) {
      throw new Error('Recipe ID is required');
    }

    const response = await fetch(`/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content.trim(),
        visibility,
        recipeId,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to create comment');
    }

    // Add the new comment to the state
    addComment(data.data);
    
    return data.data;
  }, [recipeId, addComment]);

  const refresh = useCallback(async () => {
    await fetchComments();
  }, [fetchComments]);

  // Auto-fetch comments on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchComments();
    }
  }, [autoFetch, fetchComments]);

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    createComment,
    refresh,
  };
}