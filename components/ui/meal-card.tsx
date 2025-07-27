/**
 * Meal Card Component
 * 
 * Displays a meal memory in card format with photos, name, description, and date.
 * Used in meal journal listings and search results. Simplified version of recipe cards.
 */

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Calendar, Eye, Utensils } from 'lucide-react';
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
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    
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
        <div className="h-48 bg-gray-200 overflow-hidden relative group">
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
      )}

      <div className="p-6">
        {/* Header with meal name */}
        <header className="mb-4">
          <Link href={`/meals/${meal.id}`} className="group">
            <h3 className="text-xl font-semibold text-gray-800 group-hover:text-orange-600 transition-colors line-clamp-2 mb-2">
              {meal.name}
            </h3>
          </Link>
          
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
                <div key={image.id || index} className="w-60 h-60 flex-shrink-0 overflow-hidden rounded-md">
                  <img 
                    src={getOptimizedImageUrl(image.url) || image.url} 
                    alt={image.alt || `${meal.name} meal photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Author Information */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <Avatar 
            imageUrl={meal.author.image} 
            name={meal.author.name || meal.author.email}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {meal.author.name || meal.author.email}
            </div>
            <div className="text-xs text-gray-500">
              Chef
            </div>
          </div>
        </div>

        {/* Footer with view link */}
        <footer className="pt-4 border-t border-gray-100">
          <Link 
            href={`/meals/${meal.id}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Meal
          </Link>
        </footer>
      </div>
    </article>
  );
}