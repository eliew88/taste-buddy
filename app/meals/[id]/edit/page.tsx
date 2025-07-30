/**
 * Edit Meal Page
 * 
 * Allows authenticated users to edit their own meals using the MealForm component.
 * This page fetches the existing meal data and pre-populates the form for editing.
 * 
 * Location: app/meals/[id]/edit/page.tsx
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AlertCircle, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import MealForm from '@/components/meal-form';
import { Meal, UpdateMealData, CreateMealData } from '@/types/meal';
import { CreateRecipeImageData } from '@/types/recipe';
import apiClient from '@/lib/api-client';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';

/**
 * Loading Skeleton Component
 */
const EditMealPageSkeleton = () => (
  <div className="min-h-screen">
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
  <div className="min-h-screen flex items-center justify-center">
    <div className="max-w-md w-full mx-4">
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Edit Meal</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={onRetry}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/profile/meals"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Journal
          </Link>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Main Edit Meal Page Component
 */
export default function EditMealPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const mealId = params.id as string;

  // State management
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /**
   * Fetches meal data from the API
   */
  const fetchMeal = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getMeal(mealId);
      
      if (response.success && response.data) {
        setMeal(response.data);
      } else {
        throw new Error(response.error || 'Meal not found');
      }
    } catch (err) {
      console.error('Failed to fetch meal:', err);
      setError(err instanceof Error ? err.message : 'Failed to load meal');
    } finally {
      setLoading(false);
    }
  };

  // Fetch meal on component mount
  useEffect(() => {
    if (mealId) {
      fetchMeal();
    }
  }, [mealId]);

  /**
   * Handles form submission to update the meal
   */
  const handleSubmit = async (data: CreateMealData & { images?: CreateRecipeImageData[] }) => {
    try {
      setSubmitting(true);
      
      // Convert the form data to UpdateMealData format
      const updateData: UpdateMealData = {
        name: data.name,
        description: data.description,
        date: data.date,
        images: data.images?.map(img => ({
          url: img.url,
          filename: img.filename,
          caption: img.caption,
          alt: img.alt,
          width: img.width,
          height: img.height,
          fileSize: img.fileSize,
          displayOrder: img.displayOrder,
          isPrimary: img.isPrimary
        }))
      };
      
      const response = await apiClient.updateMeal(mealId, updateData);
      
      if (response.success) {
        // Navigate back to the meal detail page
        router.push(`/meals/${mealId}`);
      } else {
        throw new Error(response.error || 'Failed to update meal');
      }
    } catch (error) {
      console.error('Failed to update meal:', error);
      throw error; // Re-throw to let MealForm handle the error display
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handles form cancellation
   */
  const handleCancel = () => {
    router.push(`/meals/${mealId}`);
  };

  /**
   * Handles meal deletion
   */
  const handleDelete = async () => {
    try {
      setDeleting(true);
      
      const response = await fetch(`/api/meals/${mealId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Navigate to meal journal after successful deletion
        router.push('/profile/meals');
      } else {
        throw new Error(data.error || 'Failed to delete meal');
      }
    } catch (error) {
      console.error('Failed to delete meal:', error);
      alert('Failed to delete meal. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Show loading skeleton while session is loading
  if (status === 'loading' || loading) {
    return <EditMealPageSkeleton />;
  }

  // Redirect to sign in if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Show error state
  if (error || !meal) {
    return (
      <ErrorDisplay 
        message={error || 'Meal not found'} 
        onRetry={fetchMeal} 
      />
    );
  }

  // Check if user is the meal owner
  if (session?.user?.id !== meal.authorId) {
    return (
      <ErrorDisplay 
        message="You can only edit meals that you created."
        onRetry={() => router.push(`/meals/${mealId}`)}
      />
    );
  }

  // Prepare initial form data from meal
  const initialData = {
    name: meal.name,
    description: meal.description || '',
    date: meal.date ? new Date(meal.date) : undefined,
    images: meal.images?.map(img => ({
      url: img.url,
      filename: img.filename,
      caption: img.caption,
      alt: img.alt,
      width: img.width,
      height: img.height,
      fileSize: img.fileSize,
      displayOrder: img.displayOrder,
      isPrimary: img.isPrimary
    })) || [],
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href={`/meals/${mealId}`}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Meal
            </Link>
            
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Meal"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Meal Form */}
      <MealForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel={submitting ? 'Updating...' : 'Update Meal'}
        isEditing={true}
      />
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Meal Memory"
        message={`Are you sure you want to delete "${meal.name}"? This action cannot be undone and the meal memory will be permanently removed.`}
        confirmText="Delete Meal"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}