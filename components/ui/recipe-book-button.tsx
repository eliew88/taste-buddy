/**
 * Recipe Book Button Component
 * 
 * Replaces the favorite button with comprehensive recipe book functionality.
 * Allows users to add recipes to their book, select categories, and manage
 * their recipe organization.
 */

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import { 
  BookOpen, 
  Plus, 
  Check, 
  X, 
  Tag, 
  Loader2,
  Heart,
  Trash2
} from 'lucide-react';
import { useRecipeBook, RecipeBookStatus } from '@/hooks/use-recipe-book';

interface RecipeBookButtonProps {
  recipeId: string;
  className?: string;
  variant?: 'default' | 'compact';
  showLabel?: boolean;
}

export default function RecipeBookButton({ 
  recipeId, 
  className = '',
  variant = 'default',
  showLabel = true
}: RecipeBookButtonProps) {
  const { data: session } = useSession();
  const {
    categories,
    loading,
    getRecipeBookStatus,
    addToRecipeBook,
    updateRecipeCategories,
    removeFromRecipeBook,
    createCategory,
    isInRecipeBook
  } = useRecipeBook();

  const [recipeBookStatus, setRecipeBookStatus] = useState<RecipeBookStatus>({
    inBook: false,
    categories: []
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');

  // Load recipe book status
  useEffect(() => {
    const loadStatus = async () => {
      if (session?.user?.id) {
        const status = await getRecipeBookStatus(recipeId);
        setRecipeBookStatus(status);
        setSelectedCategoryIds(status.categories.map(cat => cat.id));
        setNotes(status.notes || '');
      }
    };

    loadStatus();
  }, [session?.user?.id, recipeId, getRecipeBookStatus]);

  const handleToggleCategory = (categoryId: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = async () => {
    if (!session?.user?.id) {
      alert('Please sign in to add recipes to your book');
      return;
    }

    try {
      setActionLoading(true);

      let newStatus;
      if (recipeBookStatus.inBook) {
        // Update existing entry
        newStatus = await updateRecipeCategories(recipeId, selectedCategoryIds, notes.trim() || undefined);
      } else {
        // Add new entry
        newStatus = await addToRecipeBook(recipeId, selectedCategoryIds, notes.trim() || undefined);
      }

      // Update local status with the returned status
      setRecipeBookStatus(newStatus);
      setShowModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save recipe');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!session?.user?.id) return;

    try {
      setActionLoading(true);
      await removeFromRecipeBook(recipeId);
      
      // Reset status
      setRecipeBookStatus({ inBook: false, categories: [] });
      setSelectedCategoryIds([]);
      setNotes('');
      setShowModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to remove recipe');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await createCategory(
        newCategoryName.trim(),
        undefined,
        newCategoryColor
      );
      
      // Auto-select the new category
      setSelectedCategoryIds(prev => [...prev, newCategory.id]);
      
      // Reset form
      setNewCategoryName('');
      setNewCategoryColor('#3B82F6');
      setShowNewCategoryForm(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create category');
    }
  };

  if (!session?.user?.id) {
    return null; // Don't show recipe book button to unauthenticated users
  }

  const buttonClasses = variant === 'compact' 
    ? `p-2 rounded-lg transition-colors ${className}`
    : `flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors backdrop-blur-sm ${className}`;

  const isInBook = recipeBookStatus.inBook;


  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={() => setShowModal(true)}
          className={`${buttonClasses} ${
            variant === 'compact'
              ? (isInBook
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'border-2 border-green-600 text-green-600 hover:bg-green-50'
                )
              : (isInBook
                  ? 'bg-green-600/80 text-white hover:bg-green-600/90'
                  : 'bg-white/20 text-white hover:bg-white/30'
                )
          }`}
          disabled={loading}
        >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <BookOpen className={`w-5 h-5 ${
            variant === 'compact'
              ? (isInBook ? 'fill-white' : 'stroke-green-600')
              : (isInBook ? 'fill-white' : '')
          }`} />
        )}
        {showLabel && variant !== 'compact' && (
          <span>
            {isInBook ? 'In Recipe Book' : 'Add to Recipe Book'}
            {isInBook && recipeBookStatus.categories.length > 0 && (
              <span className="text-xs opacity-80 ml-1">
                ({recipeBookStatus.categories.length} categories)
              </span>
            )}
          </span>
        )}
        </button>

      </div>

      {/* Recipe Book Modal - Rendered as Portal */}
      {showModal && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
          style={{ 
            zIndex: 2147483647, // Maximum safe z-index value
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          onClick={(e) => {
            // Close modal only if clicking the backdrop
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl relative" 
            style={{ 
              zIndex: 2147483647, // Maximum safe z-index value
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {isInBook ? 'Manage Recipe Book' : 'Add to Recipe Book'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {/* Categories Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Categories
                  </label>
                  <button
                    onClick={() => setShowNewCategoryForm(true)}
                    className="text-sm text-green-700 hover:text-green-800 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Category</span>
                  </button>
                </div>

                {/* New Category Form */}
                {showNewCategoryForm && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <input
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="w-8 h-7 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowNewCategoryForm(false)}
                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateCategory}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        disabled={!newCategoryName.trim()}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                )}

                {/* Category List */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-500">No categories yet. Create your first category above.</p>
                  ) : (
                    categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.includes(category.id)}
                          onChange={() => handleToggleCategory(category.id)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex items-center space-x-2 flex-1">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color || '#3B82F6' }}
                          />
                          <span className="text-sm text-gray-900">{category.name}</span>
                          <span className="text-xs text-gray-500">({category.recipeCount})</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Notes Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your personal notes about this recipe..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center p-4 border-t bg-gray-50">
              <div>
                {isInBook && (
                  <button
                    onClick={handleRemove}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm"
                    disabled={actionLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove from Book</span>
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isInBook ? 'Update' : 'Add to Book'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}