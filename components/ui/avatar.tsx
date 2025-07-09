/**
 * Avatar Component
 * 
 * Reusable avatar component that displays user profile photos with fallbacks.
 * Supports various sizes and includes proper error handling.
 * 
 * @file components/ui/avatar.tsx
 */

'use client';

import React, { useState } from 'react';
import { User } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/image-client-utils';

interface AvatarProps {
  /** User's profile image URL */
  imageUrl?: string | null;
  /** User's name for fallback initials */
  name?: string | null;
  /** Size of the avatar */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /** Additional CSS classes */
  className?: string;
  /** Whether to show online status indicator */
  showOnline?: boolean;
  /** Alt text for accessibility */
  alt?: string;
}

/**
 * Get size classes for different avatar sizes
 */
const getSizeClasses = (size: AvatarProps['size']) => {
  switch (size) {
    case 'sm':
      return 'w-8 h-8 text-xs';
    case 'md':
      return 'w-12 h-12 text-sm';
    case 'lg':
      return 'w-16 h-16 text-base';
    case 'xl':
      return 'w-20 h-20 text-lg';
    case 'xxl':
      return 'w-24 h-24 text-xl';
    default:
      return 'w-12 h-12 text-sm';
  }
};

/**
 * Get icon size for different avatar sizes
 */
const getIconSize = (size: AvatarProps['size']) => {
  switch (size) {
    case 'sm':
      return 'w-4 h-4';
    case 'md':
      return 'w-6 h-6';
    case 'lg':
      return 'w-8 h-8';
    case 'xl':
      return 'w-10 h-10';
    case 'xxl':
      return 'w-12 h-12';
    default:
      return 'w-6 h-6';
  }
};

/**
 * Generate initials from name
 */
const getInitials = (name: string | null | undefined): string => {
  if (!name) return '';
  
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toUpperCase();
};

/**
 * Generate a consistent color based on name
 */
const getAvatarColor = (name: string | null | undefined): string => {
  if (!name) return 'bg-gray-500';
  
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function Avatar({
  imageUrl,
  name,
  size = 'md',
  className = '',
  showOnline = false,
  alt,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const sizeClasses = getSizeClasses(size);
  const iconSize = getIconSize(size);
  const initials = getInitials(name);
  const avatarColor = getAvatarColor(name);
  const optimizedImageUrl = getOptimizedImageUrl(imageUrl);
  
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };
  
  const handleImageLoad = () => {
    setImageLoading(false);
  };
  
  return (
    <div className={`relative ${sizeClasses} ${className}`}>
      <div className={`${sizeClasses} rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100`}>
        {optimizedImageUrl && !imageError ? (
          <>
            {/* Loading state */}
            {imageLoading && (
              <div className={`${sizeClasses} flex items-center justify-center bg-gray-200 animate-pulse`}>
                <User className={`${iconSize} text-gray-400`} />
              </div>
            )}
            
            {/* Profile image */}
            <img
              src={optimizedImageUrl}
              alt={alt || `${name}'s profile picture` || 'Profile picture'}
              className={`${sizeClasses} object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          </>
        ) : (
          /* Fallback when no image or image failed to load */
          <div className={`${sizeClasses} flex items-center justify-center text-white font-semibold ${avatarColor}`}>
            {initials ? (
              <span className="select-none">{initials}</span>
            ) : (
              <User className={`${iconSize} text-white`} />
            )}
          </div>
        )}
      </div>
      
      {/* Online status indicator */}
      {showOnline && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      )}
    </div>
  );
}