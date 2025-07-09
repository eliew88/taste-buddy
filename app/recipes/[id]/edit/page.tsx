/**
 * Edit Recipe Page
 * 
 * Allows authenticated users to edit their own recipes using the RecipeForm component.
 * This page fetches the existing recipe data and pre-populates the form for editing.
 * 
 * Location: app/recipes/[id]/edit/page.tsx
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import RecipeForm from '@/components/recipe-form';
import { Recipe, UpdateRecipeData } from '@/types/recipe';
import apiClient from '@/lib/api-client';

/**
 * Loading Skeleton Component
 */
const EditRecipePageSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="w-96 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="w-40 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="space-y-4">
            <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-full h-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Error Display Component
 */
const ErrorDisplay = ({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry: () => void; 
}) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="max-w-md w-full mx-4">
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Edit Recipe</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={onRetry}
            className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Main Edit Recipe Page Component
 */
export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const recipeId = params.id as string;

  // State management
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Fetches recipe data from the API
   */
  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getRecipe(recipeId);
      
      if (response.success && response.data) {
        setRecipe(response.data);
      } else {
        throw new Error(response.error || 'Recipe not found');
      }
    } catch (err) {
      console.error('Failed to fetch recipe:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recipe on component mount
  useEffect(() => {
    if (recipeId) {
      fetchRecipe();
    }
  }, [recipeId]); // fetchRecipe is stable since it doesn't depend on state

  /**
   * Handles form submission to update the recipe
   */
  const handleSubmit = async (data: UpdateRecipeData) => {
    try {
      setSubmitting(true);
      
      const response = await apiClient.updateRecipe(recipeId, data);
      
      if (response.success) {
        // Navigate back to the recipe detail page
        router.push(`/recipes/${recipeId}`);
      } else {
        throw new Error(response.error || 'Failed to update recipe');
      }
    } catch (error) {
      console.error('Failed to update recipe:', error);
      throw error; // Re-throw to let RecipeForm handle the error display
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handles form cancellation
   */
  const handleCancel = () => {
    router.push(`/recipes/${recipeId}`);
  };

  // Show loading skeleton while session is loading
  if (status === 'loading' || loading) {
    return <EditRecipePageSkeleton />;
  }

  // Redirect to sign in if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Show error state
  if (error || !recipe) {
    return (
      <ErrorDisplay 
        message={error || 'Recipe not found'} 
        onRetry={fetchRecipe} 
      />
    );
  }

  // Check if user is the recipe author
  if (session?.user?.id !== recipe.authorId) {
    return (
      <ErrorDisplay 
        message="You can only edit recipes that you created."
        onRetry={() => router.push(`/recipes/${recipeId}`)}
      />
    );
  }

  // Prepare initial form data from recipe
  const initialData = {
    title: recipe.title,
    description: recipe.description || '',
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    cookTime: recipe.cookTime || '',
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    tags: recipe.tags,
    image: recipe.image || '',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link 
            href={`/recipes/${recipeId}`}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Recipe
          </Link>
        </div>
      </nav>

      {/* Recipe Form */}
      <RecipeForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel={submitting ? 'Updating...' : 'Update Recipe'}
        isEditing={true}
      />
    </div>
  );
}