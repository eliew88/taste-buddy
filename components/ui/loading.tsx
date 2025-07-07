/**
 * Enhanced Loading Components
 * 
 * A collection of loading state components for different UI scenarios.
 * Provides consistent loading experiences across the application with
 * skeleton animations and contextual loading indicators.
 * 
 * Location: components/ui/Loading.tsx
 * 
 * Components included:
 * - LoadingSpinner: General purpose spinning indicator
 * - LoadingButton: Button with loading state
 * - LoadingSkeleton: Content placeholder animations
 * - LoadingOverlay: Full-screen loading overlay
 * - LoadingPage: Full page loading state
 */

'use client';

import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

// ==================== LOADING SPINNER ====================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'blue' | 'gray' | 'white';
}

/**
 * LoadingSpinner Component
 * 
 * Animated spinning indicator for general loading states.
 * Configurable size and color to match different contexts.
 * 
 * @param size - Spinner size (sm: 16px, md: 24px, lg: 32px, xl: 48px)
 * @param className - Additional CSS classes
 * @param color - Color theme (blue, gray, white)
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  color = 'blue'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    white: 'text-white',
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      aria-label="Loading"
    />
  );
};

// ==================== LOADING BUTTON ====================

interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * LoadingButton Component
 * 
 * Button component that shows loading state with spinner.
 * Automatically disables interaction during loading.
 * 
 * @param loading - Whether button is in loading state
 * @param children - Button content (text/icons)
 * @param onClick - Click handler function
 * @param disabled - Whether button is disabled
 * @param variant - Visual style variant
 * @param size - Button size
 */
export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && (
        <LoadingSpinner 
          size="sm" 
          color={variant === 'outline' ? 'gray' : 'white'} 
          className="mr-2" 
        />
      )}
      {children}
    </button>
  );
};

// ==================== LOADING SKELETON ====================

interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
  avatar?: boolean;
  rounded?: boolean;
}

/**
 * LoadingSkeleton Component
 * 
 * Animated placeholder that mimics content structure while loading.
 * Creates better perceived performance by showing expected layout.
 * 
 * @param className - Additional CSS classes for sizing
 * @param rows - Number of skeleton rows to display
 * @param avatar - Whether to show avatar placeholder
 * @param rounded - Whether skeleton should be rounded
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  rows = 1,
  avatar = false,
  rounded = false,
}) => {
  const baseClasses = `animate-pulse bg-gray-200 ${rounded ? 'rounded-full' : 'rounded'}`;
  
  return (
    <div className="space-y-3">
      {avatar && (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/6"></div>
          </div>
        </div>
      )}
      
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className={`h-4 ${baseClasses} ${className}`}
          style={{
            width: `${Math.random() * 40 + 60}%`, // Random width between 60-100%
          }}
        />
      ))}
    </div>
  );
};

// ==================== LOADING OVERLAY ====================

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  children?: React.ReactNode;
}

/**
 * LoadingOverlay Component
 * 
 * Full-screen overlay with loading indicator.
 * Prevents user interaction while background operations are in progress.
 * 
 * @param show - Whether overlay is visible
 * @param message - Optional loading message to display
 * @param children - Content to show instead of default spinner
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  message = 'Loading...',
  children,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 text-center max-w-sm mx-4">
        {children || (
          <>
            <LoadingSpinner size="xl" className="mx-auto mb-4" />
            <p className="text-gray-700 font-medium">{message}</p>
          </>
        )}
      </div>
    </div>
  );
};

// ==================== LOADING PAGE ====================

interface LoadingPageProps {
  message?: string;
  showLogo?: boolean;
}

/**
 * LoadingPage Component
 * 
 * Full-page loading state for initial app loads or major page transitions.
 * Provides consistent branding and messaging during load times.
 * 
 * @param message - Loading message to display
 * @param showLogo - Whether to show TasteBuddy branding
 */
export const LoadingPage: React.FC<LoadingPageProps> = ({
  message = 'Loading TasteBuddy...',
  showLogo = true,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {showLogo && (
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">TasteBuddy</h1>
            <p className="text-gray-600">Your Personal Recipe Companion</p>
          </div>
        )}
        
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <p className="text-gray-700 font-medium">{message}</p>
        
        {/* Progress dots animation */}
        <div className="flex justify-center space-x-1 mt-4">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
              style={{
                animationDelay: `${index * 0.2}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== RECIPE CARD SKELETON ====================

/**
 * RecipeCardSkeleton Component
 * 
 * Specific skeleton for recipe cards that matches the actual card layout.
 * Used in recipe grids during loading states.
 */
export const RecipeCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image skeleton */}
      <div className="aspect-video bg-gray-200 animate-pulse" />
      
      <div className="p-6">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded animate-pulse mb-3" />
        
        {/* Author skeleton */}
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-1/3" />
        
        {/* Description skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
        
        {/* Metadata skeleton */}
        <div className="flex space-x-4 mb-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-14" />
        </div>
        
        {/* Tags skeleton */}
        <div className="flex space-x-2 mb-4">
          <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16" />
          <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20" />
          <div className="h-6 bg-gray-200 rounded-full animate-pulse w-12" />
        </div>
        
        {/* Rating skeleton */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
        </div>
      </div>
    </div>
  );
};

// ==================== RECIPE GRID SKELETON ====================

interface RecipeGridSkeletonProps {
  count?: number;
}

/**
 * RecipeGridSkeleton Component
 * 
 * Grid of recipe card skeletons for homepage and search results.
 * Maintains responsive grid layout during loading.
 * 
 * @param count - Number of skeleton cards to show (default: 6)
 */
export const RecipeGridSkeleton: React.FC<RecipeGridSkeletonProps> = ({ 
  count = 6 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }, (_, index) => (
        <RecipeCardSkeleton key={index} />
      ))}
    </div>
  );
};