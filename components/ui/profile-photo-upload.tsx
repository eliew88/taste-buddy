/**
 * Profile Photo Upload Component
 * 
 * Handles profile photo uploads with drag-and-drop, preview, and validation.
 * 
 * @file components/ui/profile-photo-upload.tsx
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2, AlertCircle, Check } from 'lucide-react';
import Avatar from '@/components/ui/avatar';

interface ProfilePhotoUploadProps {
  /** Current profile photo URL */
  currentPhotoUrl?: string | null;
  /** User's name for avatar fallback */
  userName?: string | null;
  /** Callback when photo is successfully uploaded */
  onPhotoUploaded?: (photoUrl: string) => void;
  /** Callback when upload fails */
  onUploadError?: (error: string) => void;
  /** Whether the upload is in progress */
  isUploading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface UploadState {
  isDragging: boolean;
  preview: string | null;
  uploading: boolean;
  error: string | null;
  success: boolean;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ProfilePhotoUpload({
  currentPhotoUrl,
  userName,
  onPhotoUploaded,
  onUploadError,
  isUploading = false,
  className = '',
}: ProfilePhotoUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isDragging: false,
    preview: null,
    uploading: false,
    error: null,
    success: false,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  /**
   * Validate file before upload
   */
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
      };
    }
    
    return { valid: true };
  }, []);
  
  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadState(prev => ({
        ...prev,
        error: validation.error!,
        preview: null,
        success: false,
      }));
      return;
    }
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setUploadState(prev => ({
      ...prev,
      preview: previewUrl,
      error: null,
      success: false,
    }));
  }, [validateFile]);
  
  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);
  
  /**
   * Handle drag events
   */
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setUploadState(prev => ({ ...prev, isDragging: true }));
  }, []);
  
  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setUploadState(prev => ({ ...prev, isDragging: false }));
  }, []);
  
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setUploadState(prev => ({ ...prev, isDragging: false }));
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);
  
  /**
   * Upload the selected file
   */
  const handleUpload = useCallback(async (event?: React.MouseEvent) => {
    // Prevent event propagation to avoid conflicts
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!selectedFile) return;
    
    setUploadState(prev => ({ ...prev, uploading: true, error: null }));
    
    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      
      const response = await fetch('/api/upload/profile-photo', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUploadState(prev => ({
          ...prev,
          uploading: false,
          success: true,
          preview: null,
        }));
        
        // Clean up preview URL
        if (uploadState.preview) {
          URL.revokeObjectURL(uploadState.preview);
        }
        
        setSelectedFile(null);
        onPhotoUploaded?.(result.data.url);
        
        // Clear success state after 3 seconds
        setTimeout(() => {
          setUploadState(prev => ({ ...prev, success: false }));
        }, 3000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        error: errorMessage,
      }));
      onUploadError?.(errorMessage);
    }
  }, [selectedFile, uploadState.preview, onPhotoUploaded, onUploadError]);
  
  /**
   * Cancel upload and clear preview
   */
  const handleCancel = useCallback((event?: React.MouseEvent) => {
    // Prevent event propagation to avoid conflicts
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (uploadState.preview) {
      URL.revokeObjectURL(uploadState.preview);
    }
    setSelectedFile(null);
    setUploadState(prev => ({
      ...prev,
      preview: null,
      error: null,
      success: false,
    }));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadState.preview]);
  
  /**
   * Open file picker
   */
  const handleChooseFile = useCallback((event?: React.MouseEvent) => {
    // Prevent event propagation to avoid conflicts with modal or other handlers
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Small delay to ensure any ongoing state changes complete
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  }, []);
  
  // Clean up preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (uploadState.preview) {
        URL.revokeObjectURL(uploadState.preview);
      }
    };
  }, [uploadState.preview]);
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current/Preview Avatar */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <Avatar
            imageUrl={uploadState.preview || currentPhotoUrl}
            name={userName}
            size="xxl"
            className="border-4 border-white shadow-lg"
          />
          
          {/* Camera icon overlay */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleChooseFile(e);
            }}
            className="absolute bottom-0 right-0 p-2 bg-green-700 text-white rounded-full hover:bg-green-800 transition-colors shadow-lg"
            disabled={uploadState.uploading || isUploading}
            type="button"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${uploadState.isDragging
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
          }
          ${uploadState.uploading || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          e.preventDefault();
          handleChooseFile(e);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploadState.uploading || isUploading}
        />
        
        {uploadState.uploading || isUploading ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-green-700" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-green-700">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, WebP up to 2MB</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Preview Actions */}
      {uploadState.preview && selectedFile && !uploadState.uploading && (
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={handleCancel}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          
          <button
            onClick={handleUpload}
            className="flex items-center space-x-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
            type="button"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>
        </div>
      )}
      
      {/* Error Message */}
      {uploadState.error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{uploadState.error}</p>
        </div>
      )}
      
      {/* Success Message */}
      {uploadState.success && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">Profile photo updated successfully!</p>
        </div>
      )}
    </div>
  );
}