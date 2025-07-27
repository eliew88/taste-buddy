/**
 * Hook for managing multiple image uploads
 */

'use client';

import { useState, useCallback } from 'react';
import { CreateRecipeImageData } from '@/types/recipe';

interface UseMultipleImageUploadOptions {
  /** Initial images */
  initialImages?: CreateRecipeImageData[];
  /** Maximum number of images */
  maxImages?: number;
}

interface UseMultipleImageUploadReturn {
  /** Current images */
  images: CreateRecipeImageData[];
  /** Set images directly */
  setImages: (images: CreateRecipeImageData[]) => void;
  /** Add a new image */
  addImage: (image: CreateRecipeImageData) => void;
  /** Remove an image by index */
  removeImage: (index: number) => void;
  /** Update an image at specific index */
  updateImage: (index: number, updates: Partial<CreateRecipeImageData>) => void;
  /** Reorder images */
  reorderImages: (fromIndex: number, toIndex: number) => void;
  /** Set primary image */
  setPrimaryImage: (index: number) => void;
  /** Clear all images */
  clearImages: () => void;
  /** Upload function that handles API call */
  uploadImage: (file: File) => Promise<string>;
  /** Whether we can add more images */
  canAddMore: boolean;
  /** Get primary image (first image marked as primary) */
  primaryImage?: CreateRecipeImageData;
}

export function useMultipleImageUpload({
  initialImages = [],
  maxImages = 5
}: UseMultipleImageUploadOptions = {}): UseMultipleImageUploadReturn {
  const [images, setImages] = useState<CreateRecipeImageData[]>(initialImages);

  const addImage = useCallback((image: CreateRecipeImageData) => {
    setImages(prev => {
      if (prev.length >= maxImages) {
        console.warn(`Cannot add more than ${maxImages} images`);
        return prev;
      }
      
      const newImage = {
        ...image,
        displayOrder: prev.length,
        isPrimary: prev.length === 0 // First image is primary
      };
      
      return [...prev, newImage];
    });
  }, [maxImages]);

  const removeImage = useCallback((index: number) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      
      // Reorder remaining images
      const reordered = updated.map((img, i) => ({ ...img, displayOrder: i }));
      
      // If we removed the primary image, make the first one primary
      if (prev[index]?.isPrimary && reordered.length > 0) {
        reordered[0].isPrimary = true;
      }
      
      return reordered;
    });
  }, []);

  const updateImage = useCallback((index: number, updates: Partial<CreateRecipeImageData>) => {
    setImages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  }, []);

  const reorderImages = useCallback((fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      
      // Update display orders
      return updated.map((img, i) => ({ ...img, displayOrder: i }));
    });
  }, []);

  const setPrimaryImage = useCallback((index: number) => {
    setImages(prev => {
      return prev.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }));
    });
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file); // Use 'image' key to match API expectation

    const response = await fetch('/api/upload/recipe-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Upload failed');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.data.url;
  }, []);

  const canAddMore = images.length < maxImages;
  const primaryImage = images.find(img => img.isPrimary) || images[0];

  return {
    images,
    setImages,
    addImage,
    removeImage,
    updateImage,
    reorderImages,
    setPrimaryImage,
    clearImages,
    uploadImage,
    canAddMore,
    primaryImage
  };
}