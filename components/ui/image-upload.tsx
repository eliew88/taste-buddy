/**
 * ImageUpload Component
 * 
 * A comprehensive image upload component with drag & drop functionality,
 * file validation, preview, and progress tracking for recipe images.
 * 
 * Features:
 * - Drag & drop support
 * - File picker button
 * - Image preview with current image support
 * - Upload progress indicator
 * - File validation (type, size)
 * - Error handling
 * - Remove/replace image functionality
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, Check } from 'lucide-react';

interface ImageUploadProps {
  /** Current image URL (for edit mode) */
  currentImage?: string;
  
  /** Callback when image is successfully uploaded */
  onImageUploaded: (imageUrl: string) => void;
  
  /** Callback when image is removed */
  onImageRemoved: () => void;
  
  /** Whether the component is disabled */
  disabled?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Custom upload text */
  uploadText?: string;
  
  /** Show current image in preview */
  showPreview?: boolean;
}

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

/**
 * ImageUpload Component
 */
export default function ImageUpload({
  currentImage,
  onImageUploaded,
  onImageRemoved,
  disabled = false,
  className = '',
  uploadText = 'Upload recipe image',
  showPreview = true
}: ImageUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    success: false
  });
  
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation constants
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  /**
   * Validate uploaded file
   */
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_SIZE) {
      return {
        valid: false,
        error: `File size too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB`
      };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Supported formats: JPEG, PNG, WebP'
      };
    }

    return { valid: true };
  };

  /**
   * Upload file to server
   */
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload/recipe-image', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.data.url;
  };

  /**
   * Handle file upload process
   */
  const handleFileUpload = useCallback(async (file: File) => {
    // Reset state
    setUploadState({
      uploading: false,
      progress: 0,
      error: null,
      success: false
    });

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadState(prev => ({
        ...prev,
        error: validation.error || 'Invalid file'
      }));
      return;
    }

    // Show preview immediately
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      setUploadState(prev => ({ ...prev, uploading: true, progress: 10 }));

      // Simulate progress (since we can't track actual upload progress easily)
      progressInterval = setInterval(() => {
        setUploadState(prev => {
          if (prev.progress < 90) {
            return { ...prev, progress: prev.progress + 10 };
          }
          return prev;
        });
      }, 200);

      // Upload file
      const imageUrl = await uploadFile(file);
      
      if (progressInterval) clearInterval(progressInterval);

      // Success state
      setUploadState({
        uploading: false,
        progress: 100,
        error: null,
        success: true
      });

      // Clean up blob URL
      URL.revokeObjectURL(fileUrl);
      
      // Notify parent component
      onImageUploaded(imageUrl);

      // Reset success state after delay
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, success: false }));
      }, 2000);

    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      
      // Clean up blob URL on error
      URL.revokeObjectURL(fileUrl);
      setPreviewUrl(null);

      console.error('Upload error:', error);
      
      let errorMessage = 'Upload failed';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific error types
        if (error.message.includes('Authentication required')) {
          errorMessage = 'Please sign in to upload images';
        } else if (error.message.includes('B2') || error.message.includes('cloud')) {
          errorMessage = 'Cloud storage unavailable. Please try again later.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('size')) {
          errorMessage = 'File size too large. Maximum size is 5MB.';
        } else if (error.message.includes('type') || error.message.includes('format')) {
          errorMessage = 'Invalid file type. Please use JPEG, PNG, or WebP.';
        }
      }

      setUploadState({
        uploading: false,
        progress: 0,
        error: errorMessage,
        success: false
      });
    }
  }, [onImageUploaded]);

  /**
   * Handle drag events
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploadState.uploading) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileUpload(imageFile);
    } else {
      setUploadState(prev => ({
        ...prev,
        error: 'Please drop an image file'
      }));
    }
  }, [disabled, uploadState.uploading, handleFileUpload]);

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  }, [handleFileUpload]);

  /**
   * Handle remove image
   */
  const handleRemoveImage = useCallback(() => {
    setPreviewUrl(null);
    setUploadState({
      uploading: false,
      progress: 0,
      error: null,
      success: false
    });
    onImageRemoved();
  }, [onImageRemoved]);

  /**
   * Open file picker
   */
  const openFilePicker = useCallback(() => {
    if (!disabled && !uploadState.uploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploadState.uploading]);

  // Get current display image
  const displayImage = previewUrl || currentImage;
  const hasImage = Boolean(displayImage);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
          ${dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'}
          ${hasImage ? 'border-solid bg-gray-50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-green-400 hover:bg-green-50'}
          ${uploadState.uploading ? 'pointer-events-none' : ''}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={hasImage ? undefined : openFilePicker}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Content */}
        {hasImage && showPreview ? (
          // Image Preview
          <div className="relative">
            <img
              src={displayImage}
              alt="Recipe preview"
              className="max-w-full max-h-64 mx-auto rounded-lg object-cover"
            />
            
            {/* Upload Progress Overlay */}
            {uploadState.uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Uploading... {uploadState.progress}%</p>
                </div>
              </div>
            )}

            {/* Success Overlay */}
            {uploadState.success && (
              <div className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center rounded-lg">
                <div className="text-center text-white">
                  <Check className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Upload successful!</p>
                </div>
              </div>
            )}

            {/* Remove Button */}
            {!uploadState.uploading && (
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Replace Button */}
            {!uploadState.uploading && (
              <button
                onClick={openFilePicker}
                className="absolute bottom-2 right-2 px-3 py-1 bg-white bg-opacity-90 text-gray-700 rounded-lg hover:bg-opacity-100 transition-all text-sm"
              >
                Replace
              </button>
            )}
          </div>
        ) : (
          // Upload Prompt
          <div className="py-8">
            {uploadState.uploading ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 text-green-600 mx-auto animate-spin" />
                <div>
                  <p className="text-lg font-medium text-gray-700">Uploading...</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadState.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{uploadState.progress}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <ImageIcon className="w-16 h-16 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-700">{uploadText}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Drag & drop an image here, or click to browse
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={disabled}
                  className="inline-flex items-center px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </button>
                <p className="text-xs text-gray-400">
                  Supported formats: JPEG, PNG, WebP (max 5MB)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {uploadState.error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{uploadState.error}</p>
        </div>
      )}
    </div>
  );
}