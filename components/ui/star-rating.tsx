/**
 * Star Rating Component
 * 
 * A reusable component for displaying and interacting with star ratings.
 * Supports both read-only display and interactive rating input with hover effects.
 * 
 * Location: components/ui/StarRating.tsx
 * 
 * Features:
 * - Interactive 5-star rating system
 * - Configurable sizes (sm, md, lg)
 * - Hover effects for better UX
 * - Read-only mode for display purposes
 * - Accessible with proper ARIA labels
 * - Smooth transitions and animations
 */

'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  /** Current rating value (0-5) */
  rating: number;
  
  /** Callback function when user clicks a star (optional) */
  onRate?: (rating: number) => void;
  
  /** Whether the rating is interactive (default: true) */
  interactive?: boolean;
  
  /** Size variant for the stars */
  size?: 'sm' | 'md' | 'lg';
  
  /** Additional CSS classes */
  className?: string;
  
  /** Whether to show rating count and average */
  showCount?: boolean;
  
  /** Number of total ratings */
  ratingCount?: number;
  
  /** Whether to show the numeric rating value */
  showValue?: boolean;
}

/**
 * StarRating Component
 * 
 * @example
 * ```tsx
 * // Interactive rating
 * <StarRating rating={userRating} onRate={setUserRating} />
 * 
 * // Read-only display
 * <StarRating rating={recipe.avgRating} interactive={false} />
 * 
 * // Large size with count
 * <StarRating 
 *   rating={4.5} 
 *   size="lg" 
 *   showCount={true} 
 *   ratingCount={128}
 *   interactive={false}
 * />
 * ```
 */
export default function StarRating({ 
  rating, 
  onRate, 
  interactive = true,
  size = 'md',
  className = '',
  showCount = false,
  ratingCount = 0,
  showValue = false
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  
  // Size configurations
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Current rating to display (hover takes precedence in interactive mode)
  const currentRating = interactive ? (hoveredRating || rating) : rating;

  /**
   * Handles star click
   */
  const handleStarClick = (starValue: number) => {
    if (interactive && onRate) {
      onRate(starValue);
    }
  };

  /**
   * Handles mouse enter on star
   */
  const handleStarEnter = (starValue: number) => {
    if (interactive) {
      setHoveredRating(starValue);
    }
  };

  /**
   * Handles mouse leave from star container
   */
  const handleStarLeave = () => {
    if (interactive) {
      setHoveredRating(0);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Stars Container */}
      <div 
        className="flex space-x-1"
        onMouseLeave={handleStarLeave}
        role={interactive ? "radiogroup" : "img"}
        aria-label={interactive ? "Rate this recipe" : `Rating: ${rating} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`
              ${sizeClasses[size]} 
              transition-colors duration-150 ease-in-out
              ${star <= currentRating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
              } 
              ${interactive 
                ? 'cursor-pointer hover:text-yellow-400 hover:scale-110 transform transition-transform' 
                : ''
              }
            `}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarEnter(star)}
            role={interactive ? "radio" : undefined}
            aria-checked={interactive ? star <= rating : undefined}
            tabIndex={interactive ? 0 : -1}
            onKeyDown={(e) => {
              if (interactive && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleStarClick(star);
              }
            }}
          />
        ))}
      </div>

      {/* Rating Value */}
      {showValue && (
        <span className={`font-medium text-gray-700 ${textSizes[size]}`}>
          {rating.toFixed(1)}
        </span>
      )}

      {/* Rating Count */}
      {showCount && (
        <span className={`text-gray-600 ${textSizes[size]}`}>
          ({ratingCount} review{ratingCount !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
}