/**
 * Meal Card Component
 * 
 * Displays a meal memory in card format with photos, name, description, and date.
 * Used in meal journal listings and search results. Simplified version of recipe cards.
 */

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Calendar, Eye, Utensils, Users, Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Meal } from '@/types/meal';
import { truncateText } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/image-client-utils';
import Avatar from '@/components/ui/avatar';

interface MealCardProps {
  /** Meal data to display */
  meal: Meal;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Whether to show the full description */
  showFullDescription?: boolean;
  
  /** Whether this is displayed in list view (shows all photos) */
  isListView?: boolean;
}

/**
 * MealCard Component
 * 
 * Features:
 * - Meal image with fallback
 * - Name with link to detail page
 * - Author information
 * - Description with truncation
 * - Date information
 * - Photo count indicator
 * - Responsive design
 */
export default function MealCard({ 
  meal, 
  className = '',
  showFullDescription = false,
  isListView = false
}: MealCardProps) {
  // Get current user to check if they're tagged
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  
  // Check if current user is tagged in this meal
  const isUserTagged = currentUserId && meal.taggedUsers?.some(tag => tag.userId === currentUserId);
  
  // Check if current user is the author
  const isAuthor = currentUserId === meal.authorId;
  
  // Local state for image handling
  const [imageError, setImageError] = useState(false);

  // Reset image error when meal changes
  useEffect(() => {
    setImageError(false);
  }, [meal.id]);

  /**
   * Format date for display
   */
  const formatDate = (date: Date | string): string => {
    if (!date) return '';
    
    // Parse the date to get local date components
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    // Get today's date at midnight in local time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get the meal date at midnight in local time
    const mealDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    
    // Calculate difference in days
    const diffTime = today.getTime() - mealDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays < 0) return 'Future date'; // Handle future dates
    
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  /**
   * Get meal date for display (only if meal.date exists)
   */
  const getMealDate = (): string | null => {
    if (!meal.date) {
      return null;
    }
    return formatDate(meal.date);
  };

  return (
    <article 
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 ${className}`}
      aria-label={`Meal: ${meal.name}`}
    >
      {/* Grid view - show primary photo at top */}
      {!isListView && (
        <Link href={`/meals/${meal.id}`} className="block">
          <div className="h-48 bg-gray-200 overflow-hidden relative group cursor-pointer">
            {(() => {
              // Get primary image from images array, or first image if no primary
              const primaryImage = meal.images?.find(img => img.isPrimary) || meal.images?.[0];
              const imageUrl = primaryImage?.url;
              
              return imageUrl && !imageError && getOptimizedImageUrl(imageUrl) ? (
                <img 
                  src={getOptimizedImageUrl(imageUrl)!} 
                  alt={primaryImage?.alt || `${meal.name} meal`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                  onError={() => {
                    // If B2 image fails, show placeholder immediately
                    setImageError(true);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="text-center text-gray-400">
                    <Utensils className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No photo</p>
                  </div>
                </div>
              );
            })()}
            
            {/* Photo count indicator */}
            {meal.images && meal.images.length > 1 && (
              <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs font-medium">
                {meal.images.length} photos
              </div>
            )}
          </div>
        </Link>
      )}

      <div className="p-6">
        {/* Header with meal name */}
        <header className="mb-4">
          <Link href={`/meals/${meal.id}`} className="group">
            <h3 className="text-xl font-semibold text-gray-800 group-hover:text-orange-600 transition-colors line-clamp-2 mb-2">
              {meal.name}
            </h3>
          </Link>
          
          {/* Tagged indicator */}
          {isUserTagged && !isAuthor && (
            <div className="flex items-center gap-1.5 text-sm text-blue-600 font-medium mb-2">
              <Users className="w-4 h-4" />
              <span>You're tagged in this meal memory</span>
            </div>
          )}
          
          {/* Privacy indicator - only show for author's own private meals */}
          {!meal.isPublic && isAuthor && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium mb-2">
              <Lock className="w-4 h-4" />
              <span>Private meal memory</span>
            </div>
          )}
          
          {/* Date info (only show if meal.date exists) */}
          {getMealDate() && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{getMealDate()}</span>
            </div>
          )}
        </header>

        {/* Description */}
        {meal.description && (
          <div className="mb-4">
            <p className="text-gray-600 text-sm leading-relaxed">
              {showFullDescription 
                ? meal.description
                : truncateText(meal.description, 120)
              }
            </p>
          </div>
        )}

        {/* List view photos */}
        {isListView && meal.images && meal.images.length > 0 && (
          <div className="-mx-6 mb-4">
            <div 
              className="flex gap-3 overflow-x-auto px-6 pb-2"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: '#e5e7eb #f3f4f6'
              }}
            >
              {meal.images.map((image, index) => (
                <Link key={image.id || index} href={`/meals/${meal.id}`} className="block">
                  <div className="w-60 h-60 flex-shrink-0 overflow-hidden rounded-md cursor-pointer group">
                    <img 
                      src={getOptimizedImageUrl(image.url) || image.url} 
                      alt={image.alt || `${meal.name} meal photo ${index + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author Information */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <Link href={`/profile/${meal.author.id}`}>
            <Avatar 
              imageUrl={meal.author.image} 
              name={meal.author.name || 'Anonymous User'}
              size="sm"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link 
              href={`/profile/${meal.author.id}`}
              className="text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors truncate block"
            >
              {meal.author.name || 'Anonymous User'}
            </Link>
            <div className="text-xs text-gray-500">
              Chef
            </div>
          </div>
        </div>

        {/* Tagged users */}
        {meal.taggedUsers && meal.taggedUsers.length > 0 && (
          <div className="mb-4">
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  With: {meal.taggedUsers.map((tag, index) => (
                    <span key={tag.id}>
                      <span className="font-medium text-gray-800">
                        {tag.user?.name || 'Unknown'}
                      </span>
                      {index < meal.taggedUsers!.length - 1 && ', '}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer with view link */}
        <footer className="pt-4 border-t border-gray-100">
          <Link 
            href={`/meals/${meal.id}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Meal Memory
          </Link>
        </footer>
      </div>
    </article>
  );
}