/**
 * Meal Memory Creation Form Component
 * 
 * A form for creating meal memories with photos, descriptions, and tagging TasteBuddies.
 * Much simpler than recipe forms - focuses on capturing meal memories
 * rather than providing cooking instructions.
 * 
 * Location: components/meal-form.tsx
 * 
 * Features:
 * - Simple form with name, description, and date
 * - Up to 5 photo uploads with drag & drop
 * - Real-time validation
 * - Auto-save to localStorage
 * - Responsive design
 * - Loading states and error handling
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Save,
  ArrowLeft,
  AlertCircle,
  Calendar,
  Image as ImageIcon,
  FileText,
  Utensils,
  Users,
  X,
  Globe,
  Lock
} from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading';
import ErrorBoundary from '@/components/error-boundary';
import MultipleImageUpload from '@/components/ui/multiple-image-upload';
import { useMultipleImageUpload } from '@/hooks/use-multiple-image-upload';
import { useTasteBuddies } from '@/hooks/use-tastebuddies';
import apiClient from '@/lib/api-client';
import { useGlobalAchievements } from '@/components/providers/achievement-provider';
import { CreateMealData, CreateMealImageData } from '@/types/meal';
import { CreateRecipeImageData } from '@/types/recipe';

interface MealFormData extends CreateMealData {
  images?: CreateRecipeImageData[]; // Use recipe image type for upload compatibility
}

interface MealFormProps {
  initialData?: Partial<MealFormData>;
  onSubmit?: (data: MealFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isEditing?: boolean;
}

/**
 * Meal Creation/Edit Form Component
 * 
 * Handles both creating new meals and editing existing ones.
 * Provides simple validation and user-friendly interface for meal memories.
 * 
 * @param initialData - Pre-populated form data for editing
 * @param onSubmit - Custom submit handler (optional)
 * @param onCancel - Cancel handler (optional)
 * @param submitLabel - Custom submit button text
 * @param isEditing - Whether this is an edit form
 */
export default function MealForm({
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = 'Save Meal Memory',
  isEditing = false
}: MealFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { showAchievements } = useGlobalAchievements();

  // Multiple image upload state (updated to use meal-specific upload endpoint)
  const {
    images,
    setImages,
    uploadImage,
    canAddMore,
    primaryImage
  } = useMultipleImageUpload({
    initialImages: initialData.images || [],
    maxImages: 5,
    uploadEndpoint: '/api/upload/meal-image' // Use meal-specific upload endpoint
  });
  
  // Form state
  const [formData, setFormData] = useState<MealFormData>({
    name: '',
    description: '',
    date: undefined,
    isPublic: true, // Default to public
    images: [],
    taggedUserIds: [],
    ...initialData
  });

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // TasteBuddies state
  const { tastebuddies, loading: tastebuddiesLoading } = useTasteBuddies();

  // Auto-save key for localStorage
  const autoSaveKey = 'tastebuddy-meal-draft';

  // Sync multiple images state with form data
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      images: images
    }));
  }, [images]);

  /**
   * Load draft from localStorage on mount
   */
  useEffect(() => {
    if (!isEditing && !initialData.name) {
      const savedDraft = localStorage.getItem(autoSaveKey);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setFormData(prev => ({ ...prev, ...draft }));
          setIsDirty(true);
        } catch (error) {
          console.warn('Failed to load meal draft:', error);
        }
      }
    }
  }, [isEditing, initialData.name, autoSaveKey]);

  /**
   * Auto-save to localStorage when form changes
   */
  useEffect(() => {
    if (isDirty && !isEditing) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(autoSaveKey, JSON.stringify(formData));
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, isDirty, isEditing, autoSaveKey]);

  /**
   * Clear draft from localStorage
   */
  const clearDraft = () => {
    localStorage.removeItem(autoSaveKey);
  };

  /**
   * Updates form data and marks as dirty
   */
  const updateFormData = (updates: Partial<MealFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
    // Clear related errors
    const updatedFields = Object.keys(updates);
    setErrors(prev => {
      const newErrors = { ...prev };
      updatedFields.forEach(field => delete newErrors[field]);
      return newErrors;
    });
  };

  /**
   * Validates the form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Meal name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Date validation (optional, but if provided should be valid)
    if (formData.date) {
      const mealDate = new Date(formData.date);
      const now = new Date();
      if (mealDate > now) {
        newErrors.date = 'Meal date cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // First, upload any files that haven't been uploaded yet
      const uploadedImages = [];
      for (const image of images) {
        if (image.file && !image.url) {
          // This image has a file but no URL, so it needs to be uploaded
          try {
            const uploadedUrl = await uploadImage(image.file);
            uploadedImages.push({
              ...image,
              url: uploadedUrl,
              file: undefined // Remove the file object since it's now uploaded
            });
          } catch (uploadError) {
            console.error('Failed to upload image:', image.filename, uploadError);
            throw new Error(`Failed to upload image: ${image.filename}`);
          }
        } else {
          // This image already has a URL, keep it as is
          uploadedImages.push(image);
        }
      }

      const submitData = {
        ...formData,
        images: uploadedImages
      };

      if (onSubmit) {
        await onSubmit(submitData);
      } else {
        const response = await apiClient.createMeal(submitData);
        
        if (response.success) {
          clearDraft();
          
          // Show achievement notifications if any were earned
          if (response.newAchievements && response.newAchievements.length > 0) {
            console.log('🏆 Meal creation unlocked achievements:', response.newAchievements.map((a: any) => a.achievement.name));
            showAchievements(response.newAchievements);
          }
          
          router.push('/profile/meals');
        } else {
          throw new Error(response.error || 'Failed to save meal');
        }
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to save meal. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles cancel action
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  /**
   * Format date for input field
   */
  const formatDateForInput = (date?: Date | string): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };
  
  /**
   * Toggle a TasteBuddy tag
   */
  const toggleTasteBuddy = (userId: string) => {
    const currentTags = formData.taggedUserIds || [];
    const isTagged = currentTags.includes(userId);
    
    if (isTagged) {
      updateFormData({
        taggedUserIds: currentTags.filter(id => id !== userId)
      });
    } else {
      updateFormData({
        taggedUserIds: [...currentTags, userId]
      });
    }
  };

  return (
    <ErrorBoundary>
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleCancel}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Meal Memory' : 'Add New Meal Memory'}
            </h1>
            <p className="text-gray-600 text-sm">
              Capture your meal memories with photos and notes
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Error */}
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{errors.submit}</span>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Utensils className="w-4 h-4" />
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              placeholder="What would you like to remember this meal as?"
              className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              maxLength={100}
            />
            {errors.name && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="w-4 h-4" />
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="Tell us about this meal... How was it? Where did you have it? Any special memories?"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {(formData.description || '').length}/500 characters
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4" />
              Date (Optional)
            </label>
            <input
              type="date"
              value={formatDateForInput(formData.date)}
              onChange={(e) => updateFormData({ 
                date: e.target.value ? new Date(e.target.value) : undefined 
              })}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.date && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.date}
              </div>
            )}
            <p className="text-xs text-gray-500">
              When did you have this meal? Leave blank if you're not sure.
            </p>
          </div>

          {/* Privacy Setting */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Privacy</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => updateFormData({ isPublic: true })}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  formData.isPublic
                    ? 'border-2 text-white'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
                style={formData.isPublic ? { 
                  backgroundColor: '#1768AC',
                  borderColor: '#1768AC'
                } : {}}
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium">Public</span>
              </button>
              <button
                type="button"
                onClick={() => updateFormData({ isPublic: false })}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  !formData.isPublic
                    ? 'border-2 text-white'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
                style={!formData.isPublic ? { 
                  backgroundColor: '#1768AC',
                  borderColor: '#1768AC'
                } : {}}
              >
                <Lock className="w-4 h-4" />
                <span className="font-medium">Private</span>
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {formData.isPublic
                ? "Public meal memories appear in feeds and can be seen by anyone."
                : "Private meal memories are only visible to you in your journal."}
            </p>
          </div>

          {/* Tag TasteBuddies */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="w-4 h-4" />
              Tag TasteBuddies
            </label>
            {tastebuddiesLoading ? (
              <p className="text-sm text-gray-500">Loading your TasteBuddies...</p>
            ) : tastebuddies.length === 0 ? (
              <p className="text-sm text-gray-500">
                You don't have any TasteBuddies yet. TasteBuddies are people you follow who also follow you back.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {tastebuddies.map((buddy) => {
                    const isTagged = formData.taggedUserIds?.includes(buddy.id);
                    return (
                      <button
                        key={buddy.id}
                        type="button"
                        onClick={() => toggleTasteBuddy(buddy.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                          isTagged
                            ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                            : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
                        }`}
                        style={isTagged ? {
                          backgroundColor: '#E3F2FD',
                          color: '#1768AC',
                          borderColor: '#90CAF9'
                        } : {}}
                      >
                        {buddy.image && (
                          <img
                            src={buddy.image}
                            alt={buddy.name}
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                        <span>{buddy.name}</span>
                        {isTagged && <X className="w-3 h-3 ml-1" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500">
                  {formData.isPublic
                    ? "Tag TasteBuddies who were part of this meal memory. They'll be able to see this meal in their journal."
                    : "Tag TasteBuddies who were part of this meal memory. Note: Since this is a private meal, tagged users won't be able to see it."}
                </p>
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <MultipleImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={5}
              className="border-2 border-dashed border-gray-300 rounded-lg"
              theme="meal"
            />
            <p className="text-xs text-gray-500">
              Add up to 5 photos of your meal. The first photo (or the one you mark as primary) will be used as the main image.
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
              style={{ backgroundColor: '#1768AC' }}
              onMouseEnter={(e) => !isSubmitting && ((e.target as HTMLElement).style.backgroundColor = '#135285')}
              onMouseLeave={(e) => !isSubmitting && ((e.target as HTMLElement).style.backgroundColor = '#1768AC')}
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              <Save className="w-4 h-4 mr-2" />
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
}