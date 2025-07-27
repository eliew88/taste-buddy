/**
 * Multiple Image Upload Component
 * 
 * Supports uploading and managing multiple images with drag-and-drop,
 * reordering, captions, primary photo selection, and individual image management.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { 
  Plus, 
  X, 
  Upload, 
  GripVertical,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Star,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { CreateRecipeImageData } from '@/types/recipe';

interface MultipleImageUploadProps {
  /** Current images (can be URLs from existing recipe or File objects for new images) */
  images: CreateRecipeImageData[];
  /** Callback when images change */
  onImagesChange: (images: CreateRecipeImageData[]) => void;
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Optional CSS class */
  className?: string;
}

interface ImageWithPreview extends CreateRecipeImageData {
  preview?: string; // For showing preview of File objects
  file?: File; // Store the actual File object for new uploads
}

export default function MultipleImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  className = ''
}: MultipleImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [imagesWithPreview, setImagesWithPreview] = useState<ImageWithPreview[]>(() => 
    images.map((img, index) => ({ 
      ...img,
      // Ensure we have a primary image if none is set
      isPrimary: img.isPrimary ?? index === 0
    }))
  );

  // Notify parent when images change (but not during initial render)
  const [hasInitialized, setHasInitialized] = React.useState(false);
  React.useEffect(() => {
    if (hasInitialized) {
      const imagesToPass = imagesWithPreview.map(({ preview, ...img }) => img);
      onImagesChange(imagesToPass);
    } else {
      setHasInitialized(true);
    }
  }, [imagesWithPreview, onImagesChange, hasInitialized]);

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP files are allowed';
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }

    return null;
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Check if adding these files would exceed the limit
    if (imagesWithPreview.length + fileArray.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`);
      return;
    }

    const newImages: ImageWithPreview[] = [];
    
    // Check if there's already a primary image
    const hasPrimaryImage = imagesWithPreview.some(img => img.isPrimary);

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        alert(`Error with ${file.name}: ${validationError}`);
        continue;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);
      const newImage: ImageWithPreview = {
        url: '', // Will be empty until actually uploaded to B2
        displayOrder: imagesWithPreview.length + newImages.length,
        filename: file.name,
        fileSize: file.size,
        preview,
        file, // Store the File object
        isPrimary: !hasPrimaryImage && imagesWithPreview.length === 0 && newImages.length === 0 // Only set as primary if no other image is primary
      };

      newImages.push(newImage);
    }

    // Update state with new images (no upload yet)
    const updatedImages = [...imagesWithPreview, ...newImages];
    setImagesWithPreview(updatedImages);
  }, [imagesWithPreview.length, maxImages]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFileUpload]);

  const removeImage = useCallback((index: number) => {
    setImagesWithPreview(prev => {
      const updated = [...prev];
      const image = updated[index];
      
      // Clean up preview URL if it exists
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }
      
      updated.splice(index, 1);
      
      // Update display orders and ensure we have a primary image
      const reordered = updated.map((img, i) => ({ ...img, displayOrder: i }));
      
      // If we removed the primary image, make the first one primary
      if (image.isPrimary && reordered.length > 0) {
        reordered[0].isPrimary = true;
      }
      
      return reordered;
    });
  }, []);

  const updateImageCaption = useCallback((index: number, caption: string) => {
    setImagesWithPreview(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], caption };
      return updated;
    });
  }, []);

  const setPrimaryImage = useCallback((index: number) => {
    setImagesWithPreview(prev => {
      const updated = prev.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }));
      return updated;
    });
  }, []);

  const moveImageUp = useCallback((index: number) => {
    if (index === 0) return;
    
    setImagesWithPreview(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.splice(index - 1, 0, moved);
      
      // Update display orders
      const reordered = updated.map((img, i) => ({ ...img, displayOrder: i }));
      return reordered;
    });
  }, []);

  const moveImageDown = useCallback((index: number) => {
    setImagesWithPreview(prev => {
      if (index >= prev.length - 1) return prev;
      
      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.splice(index + 1, 0, moved);
      
      // Update display orders
      const reordered = updated.map((img, i) => ({ ...img, displayOrder: i }));
      return reordered;
    });
  }, []);

  const canAddMore = imagesWithPreview.length < maxImages;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <ImageIcon className="w-5 h-5 mr-2 text-green-700" />
          Recipe Images ({imagesWithPreview.length}/{maxImages})
        </h3>
        {imagesWithPreview.length > 0 && (
          <p className="text-sm text-gray-600">
            <Star className="w-4 h-4 inline text-purple-600 mr-1" />
            Purple outline = Primary photo
          </p>
        )}
      </div>

      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-2">
            Drag and drop images here, or click to select
          </p>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="inline-flex items-center px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Select Images
          </label>
          <p className="text-xs text-gray-500 mt-2">
            JPEG, PNG, WebP up to 5MB each • First image will be your primary photo
          </p>
        </div>
      )}

      {/* Images Grid */}
      {imagesWithPreview.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {imagesWithPreview.map((image, index) => (
            <div
              key={index}
              className={`relative bg-white border-2 rounded-lg overflow-hidden shadow-sm transition-all ${
                image.isPrimary 
                  ? 'border-purple-500 ring-2 ring-purple-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Image Preview */}
              <div className="aspect-video bg-gray-100 relative">
                <img
                  src={image.preview || image.url}
                  alt={image.alt || `Recipe image ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    Primary
                  </div>
                )}

                {/* Order Badge */}
                {!image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                )}

                {/* Move Handle */}
                {imagesWithPreview.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-75 text-white rounded p-1">
                    <GripVertical className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Image Controls */}
              <div className="p-3 space-y-2">
                <input
                  type="text"
                  placeholder="Add a caption (optional)"
                  value={image.caption || ''}
                  onChange={(e) => updateImageCaption(index, e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                
                {/* Action buttons */}
                <div className="flex justify-between items-center">
                  {/* Primary button */}
                  {!image.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(index)}
                      className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded flex items-center"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Make Primary
                    </button>
                  )}
                  
                  {image.isPrimary && (
                    <span className="text-xs text-purple-600 font-medium flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      Primary Photo
                    </span>
                  )}

                  {/* Move buttons */}
                  {imagesWithPreview.length > 1 && (
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => moveImageUp(index)}
                        disabled={index === 0}
                        className="text-xs bg-gray-100 hover:bg-gray-200 p-1 rounded disabled:opacity-50"
                        title="Move up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImageDown(index)}
                        disabled={index === imagesWithPreview.length - 1}
                        className="text-xs bg-gray-100 hover:bg-gray-200 p-1 rounded disabled:opacity-50"
                        title="Move down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      {imagesWithPreview.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No images added yet</p>
          <p className="text-sm">Add some photos to showcase your recipe!</p>
        </div>
      )}
    </div>
  );
}