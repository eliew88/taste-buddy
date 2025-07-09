/**
 * Custom hook for managing image upload state in forms
 * 
 * Provides a simple interface for handling image uploads in recipe forms,
 * with state management for the current image URL.
 */

'use client';

import { useState, useCallback } from 'react';

interface UseImageUploadReturn {
  /** Current image URL */
  imageUrl: string | null;
  
  /** Set image URL (for initial values) */
  setImageUrl: (url: string | null) => void;
  
  /** Handle successful image upload */
  handleImageUploaded: (url: string) => void;
  
  /** Handle image removal */
  handleImageRemoved: () => void;
  
  /** Whether an image is currently set */
  hasImage: boolean;
}

/**
 * Hook for managing image upload state
 * 
 * @param initialImageUrl - Initial image URL (for edit mode)
 * @returns Object with image state and handlers
 */
export function useImageUpload(initialImageUrl?: string | null): UseImageUploadReturn {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);

  const handleImageUploaded = useCallback((url: string) => {
    setImageUrl(url);
  }, []);

  const handleImageRemoved = useCallback(() => {
    setImageUrl(null);
  }, []);

  return {
    imageUrl,
    setImageUrl,
    handleImageUploaded,
    handleImageRemoved,
    hasImage: Boolean(imageUrl),
  };
}