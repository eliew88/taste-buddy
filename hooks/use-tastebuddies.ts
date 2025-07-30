/**
 * Custom hook for managing TasteBuddies (mutual follows)
 */

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';

export interface TasteBuddy {
  id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
}

export function useTasteBuddies() {
  const [tastebuddies, setTasteBuddies] = useState<TasteBuddy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasteBuddies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users/tastebuddies');
      const data = await response.json();
      
      if (data.success) {
        setTasteBuddies(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch TasteBuddies');
      }
    } catch (err) {
      console.error('Error fetching TasteBuddies:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch TasteBuddies');
      setTasteBuddies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasteBuddies();
  }, [fetchTasteBuddies]);

  return {
    tastebuddies,
    loading,
    error,
    refetch: fetchTasteBuddies
  };
}