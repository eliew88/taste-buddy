/**
 * Meal Detail Page
 * 
 * Dynamic route page that displays full meal information with emphasis on
 * photos and memories. Simplified version of recipe detail page.
 * 
 * Location: app/meals/[id]/page.tsx
 * 
 * Features:
 * - Photo-focused layout with gallery
 * - Meal memory display with rich formatting
 * - Edit capabilities for meal owner
 * - Responsive design for all screen sizes
 * - Error handling and loading states
 * - Navigation back to meal journal
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  User,
  AlertCircle,
  Edit,
  Utensils,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { useMeal } from '@/hooks/use-meals';
import { Meal } from '@/types/meal';
import { getOptimizedImageUrl } from '@/lib/image-client-utils';
import RecipeImageGallery from '@/components/ui/recipe-image-gallery';
import Avatar from '@/components/ui/avatar';

/**
 * Loading Skeleton Component
 */
const MealDetailSkeleton = () => (
  <div className="min-h-screen">
    <nav className="bg-orange-50 shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="ml-3 w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </nav>
    
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="w-full h-8 bg-gray-200 rounded animate-pulse mb-6"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="w-full h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-2">
            <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="w-full h-32 bg-gray-200 rounded animate-pulse"></div>
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
      <div className="bg-orange-50 rounded-lg shadow-md p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Meal Not Found</h2>
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
 * Main Meal Detail Page Component
 */
export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const mealId = params.id as string;

  // Use the meal hook to fetch data
  const { meal, loading, error, refetch, resetError } = useMeal(mealId);

  /**
   * Format date for display
   */
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  /**
   * Get relative time for meal
   */
  const getRelativeTime = (date: Date | string): string => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    
    return formatDate(date);
  };

  // Check if current user is the meal owner
  const isOwner = session?.user?.id === meal?.authorId;

  if (loading) {
    return <MealDetailSkeleton />;
  }

  if (error || !meal) {
    return (
      <ErrorDisplay 
        message={error || 'This meal could not be found.'}
        onRetry={() => {
          resetError();
          refetch();
        }}
      />
    );
  }

  // Convert meal images to recipe image format for gallery compatibility
  const galleryImages = meal.images?.map(img => ({
    ...img,
    id: img.id || '',
    recipeId: meal.id // Use meal ID as recipe ID for compatibility
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/profile/meals"
              className="flex items-center text-orange-600 hover:text-orange-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Back to Journal</span>
            </Link>
            
            {isOwner && (
              <Link
                href={`/meals/${meal.id}/edit`}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Meal
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between gap-6 mb-4">
            {/* Left side - Meal info */}
            <div className="flex items-start gap-4 flex-1">
              <span className="text-3xl flex-shrink-0 mt-1">🥘</span>
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {meal.name}
                </h1>
                
                {/* Date and metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {meal.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(meal.date)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Added {getRelativeTime(meal.createdAt)}</span>
                  </div>
                  {meal.images && meal.images.length > 0 && (
                    <div className="flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" />
                      <span>{meal.images.length} photo{meal.images.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Chef info and tagged users */}
            <div className="flex-shrink-0">
              {/* Posted by info */}
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm mb-3">
                <Link href={`/profile/${meal.author.id}`}>
                  <Avatar 
                    imageUrl={meal.author.image} 
                    name={meal.author.name || meal.author.email}
                    size="md"
                  />
                </Link>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Posted by
                  </div>
                  <Link 
                    href={`/profile/${meal.author.id}`}
                    className="font-medium text-gray-900 hover:text-orange-600 transition-colors"
                  >
                    {meal.author.name || meal.author.email}
                  </Link>
                </div>
              </div>

              {/* Tagged users compact list */}
              {meal.taggedUsers && meal.taggedUsers.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-3">
                  <h3 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Tagged ({meal.taggedUsers.length})
                  </h3>
                  <div className="space-y-1.5">
                    {meal.taggedUsers.map((tag) => (
                      <Link 
                        key={tag.id}
                        href={`/profile/${tag.userId}`}
                        className="flex items-center gap-1.5 hover:bg-gray-50 rounded-md p-0.5 -m-0.5 transition-colors"
                      >
                        <div className="w-6 h-6 flex-shrink-0">
                          <Avatar 
                            imageUrl={tag.user?.image} 
                            name={tag.user?.name || tag.user?.email || 'Unknown'}
                            size="xs"
                          />
                        </div>
                        <span className="text-xs text-gray-600 hover:text-orange-600 transition-colors truncate">
                          {tag.user?.name || tag.user?.email || 'Unknown'}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Description */}
        {meal.description && (
          <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {meal.description}
              </p>
            </div>
          </section>
        )}


        {/* Photo Gallery */}
        {galleryImages.length > 0 ? (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Photos</h2>
            <RecipeImageGallery 
              images={galleryImages}
              recipeTitle={meal.name}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            />
          </section>
        ) : (
          <section className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center text-gray-400">
              <Utensils className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No photos</p>
              <p className="text-sm">This meal doesn't have any photos yet.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}