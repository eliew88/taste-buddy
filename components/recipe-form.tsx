/**
 * Recipe Creation Form Component
 * 
 * A comprehensive form for creating new recipes with validation,
 * dynamic fields, and excellent user experience.
 * 
 * Location: components/RecipeForm.tsx
 * 
 * Features:
 * - Multi-step form sections
 * - Dynamic ingredient and tag management
 * - Real-time validation
 * - Auto-save to localStorage
 * - Rich text instructions
 * - Image upload placeholder
 * - Responsive design
 * - Loading states and error handling
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  X,
  Clock,
  Users,
  ChefHat,
  Save,
  ArrowLeft,
  AlertCircle,
  // Check,
  Image as ImageIcon,
  Tag,
  List
} from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading';
import ErrorBoundary from '@/components/error-boundary';
import ImageUpload from '@/components/ui/image-upload';
import IngredientInput from '@/components/ui/ingredient-input';
import { useImageUpload } from '@/hooks/use-image-upload';
import apiClient from '@/lib/api-client';
import { CreateRecipeData, CreateIngredientEntryData } from '@/types/recipe';

interface RecipeFormData extends CreateRecipeData {
  image?: string;
}

interface RecipeFormProps {
  initialData?: Partial<RecipeFormData>;
  onSubmit?: (data: RecipeFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isEditing?: boolean;
}

/**
 * Recipe Creation/Edit Form Component
 * 
 * Handles both creating new recipes and editing existing ones.
 * Provides comprehensive validation and user-friendly interface.
 * 
 * @param initialData - Pre-populated form data for editing
 * @param onSubmit - Custom submit handler (optional)
 * @param onCancel - Cancel handler (optional)
 * @param submitLabel - Custom submit button text
 * @param isEditing - Whether this is an edit form
 */
export default function RecipeForm({
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = 'Create Recipe',
  isEditing = false
}: RecipeFormProps) {
  const router = useRouter();
  
  // Image upload state
  const {
    imageUrl,
    setImageUrl,
    handleImageUploaded,
    handleImageRemoved,
    hasImage
  } = useImageUpload(initialData.image);
  
  // Form state
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    ingredients: [{ amount: undefined, unit: undefined, ingredient: '' }],
    instructions: '',
    cookTime: '',
    servings: undefined,
    difficulty: 'easy',
    tags: [],
    image: '',
    ...initialData
  });

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  // const [showPreview, setShowPreview] = useState(false);

  // Auto-save key for localStorage
  const autoSaveKey = 'tastebuddy-recipe-draft';

  // Sync image state with form data
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      image: imageUrl || ''
    }));
  }, [imageUrl]);

  /**
   * Load draft from localStorage on mount
   */
  useEffect(() => {
    if (!isEditing && !initialData.title) {
      const savedDraft = localStorage.getItem(autoSaveKey);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setFormData(prev => ({ ...prev, ...draft }));
          setIsDirty(true);
        } catch (error) {
          console.warn('Failed to load draft:', error);
        }
      }
    }
  }, [isEditing, initialData.title, autoSaveKey]);

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
  const updateFormData = (updates: Partial<RecipeFormData>) => {
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

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Recipe title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    // Ingredients validation
    const validIngredients = formData.ingredients.filter(ing => 
      ing.ingredient.trim() // Only require ingredient name, amount is optional
    );
    if (validIngredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required';
    }

    // Instructions validation
    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Cooking instructions are required';
    } else if (formData.instructions.trim().length < 10) {
      newErrors.instructions = 'Instructions must be at least 10 characters';
    }

    // Servings validation
    if (formData.servings && (formData.servings < 1 || formData.servings > 100)) {
      newErrors.servings = 'Servings must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles ingredient list changes
   */
  const handleIngredientsChange = useCallback((ingredients: CreateIngredientEntryData[]) => {
    updateFormData({ ingredients });
  }, []);

  /**
   * Handles tag management
   */
  const addTag = () => {
    const tag = currentTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      updateFormData({ tags: [...formData.tags, tag] });
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData({ tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
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

    try {
      // Clean up form data
      const cleanedData: RecipeFormData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        ingredients: formData.ingredients.filter(ing => 
          ing.ingredient.trim() // Only require ingredient name, amount is optional
        ),
        instructions: formData.instructions.trim(),
        cookTime: formData.cookTime?.trim() || undefined,
      };

      if (onSubmit) {
        await onSubmit(cleanedData);
      } else {
        // Default API submission
        const response = await apiClient.createRecipe(cleanedData);
        
        if (response.success) {
          clearDraft();
          router.push(`/recipes/${response.data?.id}`);
        } else {
          throw new Error(response.error || 'Failed to create recipe');
        }
      }
    } catch (error) {
      console.error('Failed to submit recipe:', error);
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to save recipe' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles form cancellation
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  /**
   * Popular tags for quick selection
   */
  const popularTags = [
    'breakfast', 'lunch', 'dinner', 'dessert', 'snack',
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
    'quick', 'easy', 'healthy', 'comfort-food',
    'italian', 'asian', 'mexican', 'indian', 'american'
  ];

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleCancel}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            
            {isDirty && !isEditing && (
              <div className="flex items-center text-sm text-gray-600 bg-purple-100 px-3 py-1 rounded-full">
                <Save className="w-4 h-4 mr-1" />
                Draft auto-saved
              </div>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Recipe' : 'Create New Recipe'}
          </h1>
          <p className="text-gray-600 mt-2">
            Share your culinary creation with the TasteBuddy community
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <section className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <List className="w-5 h-5 mr-2 text-green-700" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Grandma's Chocolate Chip Cookies"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  placeholder="Tell us about this recipe - what makes it special?"
                />
              </div>

              {/* Cook Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Cook Time
                </label>
                <input
                  type="text"
                  value={formData.cookTime}
                  onChange={(e) => updateFormData({ cookTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  placeholder="e.g., 30 mins, 1h 15m"
                />
              </div>

              {/* Servings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Servings
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.servings || ''}
                  onChange={(e) => updateFormData({ 
                    servings: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600 ${
                    errors.servings ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="4"
                />
                {errors.servings && (
                  <p className="mt-1 text-sm text-red-600">{errors.servings}</p>
                )}
              </div>

              {/* Difficulty */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ChefHat className="w-4 h-4 inline mr-1" />
                  Difficulty Level
                </label>
                <div className="flex space-x-4">
                  {['easy', 'medium', 'hard'].map((level) => (
                    <label key={level} className="flex items-center">
                      <input
                        type="radio"
                        name="difficulty"
                        value={level}
                        checked={formData.difficulty === level}
                        onChange={(e) => updateFormData({ difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                        className="mr-2 text-green-700"
                      />
                      <span className="capitalize">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Image Upload */}
          <section className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2 text-green-700" />
              Recipe Image
            </h2>
            
            <ImageUpload
              currentImage={imageUrl || undefined}
              onImageUploaded={handleImageUploaded}
              onImageRemoved={handleImageRemoved}
              uploadText="Add a photo of your recipe"
              className="w-full"
            />
          </section>

          {/* Ingredients */}
          <section className="bg-white rounded-lg shadow-sm border p-6">
            <IngredientInput
              ingredients={formData.ingredients}
              onChange={handleIngredientsChange}
            />
            
            {errors.ingredients && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.ingredients}
              </p>
            )}
          </section>

          {/* Instructions */}
          <section className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Instructions *
            </h2>
            
            <textarea
              value={formData.instructions}
              onChange={(e) => updateFormData({ instructions: e.target.value })}
              rows={8}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600 ${
                errors.instructions ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Provide step-by-step instructions for preparing this recipe..."
            />
            
            {errors.instructions && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.instructions}
              </p>
            )}
          </section>

          {/* Tags */}
          <section className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-green-700" />
              Tags
            </h2>
            
            {/* Current Tags */}
            {formData.tags.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-green-700 hover:text-green-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add Tag */}
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
                placeholder="Add a tag (e.g., vegetarian, quick, dessert)"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!currentTag.trim()}
                className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            
            {/* Popular Tags */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Popular tags:</p>
              <div className="flex flex-wrap gap-2">
                {popularTags
                  .filter(tag => !formData.tags.includes(tag))
                  .slice(0, 10)
                  .map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => updateFormData({ tags: [...formData.tags, tag] })}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200"
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            </div>
          </section>

          {/* Submit Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <div className="flex space-x-3">
              {!isEditing && isDirty && (
                <button
                  type="button"
                  onClick={clearDraft}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Clear Draft
                </button>
              )}
              
              <LoadingButton
                type="submit"
                loading={isSubmitting}
                variant="primary"
                size="lg"
                className="px-8"
              >
                {submitLabel}
              </LoadingButton>
            </div>
          </div>
          
          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </ErrorBoundary>
  );
}