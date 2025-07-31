/**
 * Custom hook for Recipe Book management
 * 
 * Provides functionality to manage recipes in the user's recipe book,
 * including adding recipes to categories, checking book status, and
 * managing categories.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface RecipeBookCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  recipeCount: number;
  createdAt: Date;
}

export interface RecipeBookStatus {
  inBook: boolean;
  categories: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  notes?: string;
}

export function useRecipeBook() {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<RecipeBookCategory[]>([]);
  const [recipeBookStatus, setRecipeBookStatus] = useState<Map<string, RecipeBookStatus>>(new Map());
  const [loading, setLoading] = useState(false);

  // Fetch user's categories
  const fetchCategories = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/recipe-book/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching recipe book categories:', error);
    }
  }, [session?.user?.id]);

  // Load categories when session is available
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Check if recipe is in recipe book
  const getRecipeBookStatus = useCallback(async (recipeId: string): Promise<RecipeBookStatus> => {
    if (!session?.user?.id) {
      return { inBook: false, categories: [] };
    }

    // Check cache first
    const cached = recipeBookStatus.get(recipeId);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`/api/recipe-book/recipes/${recipeId}`);
      const data = await response.json();
      
      if (data.success) {
        const status = data.data;
        setRecipeBookStatus(prev => new Map(prev).set(recipeId, status));
        return status;
      }
    } catch (error) {
      console.error('Error fetching recipe book status:', error);
    }

    const defaultStatus = { inBook: false, categories: [] };
    setRecipeBookStatus(prev => new Map(prev).set(recipeId, defaultStatus));
    return defaultStatus;
  }, [session?.user?.id, recipeBookStatus]);

  // Add recipe to recipe book with categories
  const addToRecipeBook = useCallback(async (
    recipeId: string, 
    categoryIds: string[] = [], 
    notes?: string
  ): Promise<RecipeBookStatus> => {
    if (!session?.user?.id) {
      throw new Error('Please sign in to add recipes to your book');
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/recipe-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId,
          categoryIds,
          notes,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update cache
        const newStatus: RecipeBookStatus = {
          inBook: true,
          categories: categories.filter(cat => categoryIds.includes(cat.id)).map(cat => ({
            id: cat.id,
            name: cat.name,
            color: cat.color
          })),
          notes
        };
        setRecipeBookStatus(prev => new Map(prev).set(recipeId, newStatus));
        
        // Refresh categories to update counts
        await fetchCategories();
        
        return newStatus;
      } else {
        throw new Error(data.error || 'Failed to add recipe to book');
      }
    } catch (error) {
      console.error('Error adding recipe to book:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, categories, fetchCategories]);

  // Update recipe's categories in recipe book
  const updateRecipeCategories = useCallback(async (
    recipeId: string,
    categoryIds: string[] = [],
    notes?: string
  ): Promise<RecipeBookStatus> => {
    if (!session?.user?.id) {
      throw new Error('Please sign in to update your recipe book');
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/recipe-book/recipes/${recipeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryIds,
          notes,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update cache
        const newStatus: RecipeBookStatus = {
          inBook: true,
          categories: categories.filter(cat => categoryIds.includes(cat.id)).map(cat => ({
            id: cat.id,
            name: cat.name,
            color: cat.color
          })),
          notes
        };
        setRecipeBookStatus(prev => new Map(prev).set(recipeId, newStatus));
        
        // Refresh categories to update counts
        await fetchCategories();
        
        return newStatus;
      } else {
        throw new Error(data.error || 'Failed to update recipe categories');
      }
    } catch (error) {
      console.error('Error updating recipe categories:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, categories, fetchCategories]);

  // Remove recipe from recipe book
  const removeFromRecipeBook = useCallback(async (recipeId: string): Promise<boolean> => {
    if (!session?.user?.id) {
      throw new Error('Please sign in to manage your recipe book');
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/recipe-book/recipes/${recipeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        // Update cache
        const newStatus: RecipeBookStatus = {
          inBook: false,
          categories: []
        };
        setRecipeBookStatus(prev => new Map(prev).set(recipeId, newStatus));
        
        // Refresh categories to update counts
        await fetchCategories();
        
        return true;
      } else {
        throw new Error(data.error || 'Failed to remove recipe from book');
      }
    } catch (error) {
      console.error('Error removing recipe from book:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, fetchCategories]);

  // Create new category
  const createCategory = useCallback(async (
    name: string,
    description?: string,
    color?: string
  ): Promise<RecipeBookCategory> => {
    if (!session?.user?.id) {
      throw new Error('Please sign in to create categories');
    }

    try {
      const response = await fetch('/api/recipe-book/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          color,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const newCategory = data.data;
        setCategories(prev => [...prev, newCategory]);
        return newCategory;
      } else {
        throw new Error(data.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }, [session?.user?.id]);

  // Check if recipe is in book (cached)
  const isInRecipeBook = useCallback((recipeId: string): boolean => {
    const status = recipeBookStatus.get(recipeId);
    return status?.inBook || false;
  }, [recipeBookStatus]);

  return {
    categories,
    loading,
    getRecipeBookStatus,
    addToRecipeBook,
    updateRecipeCategories,
    removeFromRecipeBook,
    createCategory,
    isInRecipeBook,
    refreshCategories: fetchCategories,
  };
}