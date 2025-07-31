/**
 * Recipe Book Page
 * 
 * Displays the user's recipe book with category management and filtering capabilities.
 * Replaces the old favorites system with a more comprehensive recipe organization tool.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Loader2, 
  AlertCircle, 
  Plus,
  Edit3,
  Trash2,
  Tag,
  FolderOpen
} from 'lucide-react';
import Navigation from '@/components/ui/Navigation';
import RecipeCard from '@/components/ui/recipe-card';
import { IngredientEntry } from '@/types/recipe';

interface RecipeBookRecipe {
  id: string;
  title: string;
  description?: string;
  ingredients: IngredientEntry[];
  instructions: string;
  cookTime?: string;
  servings?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  isPublic: boolean;
  images?: any[];
  image?: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  addedAt: Date;
  notes?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  categories?: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  author: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    favorites: number;
    ratings: number;
    comments: number;
    recipeBookEntries: number;
  };
  avgRating?: number;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  recipeCount: number;
  createdAt: Date;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'title' | 'difficulty';

export default function RecipeBookPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State management
  const [recipes, setRecipes] = useState<RecipeBookRecipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeBookRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  // Category management state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');

  // Compute unique recipe count for "All Recipes"
  const uniqueRecipeCount = React.useMemo(() => {
    const uniqueRecipeIds = new Set(recipes.map(recipe => recipe.id));
    return uniqueRecipeIds.size;
  }, [recipes]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!session?.user?.id) return;
      
      try {
        setCategoriesLoading(true);
        const response = await fetch('/api/recipe-book/categories');
        const data = await response.json();
        
        if (data.success) {
          setCategories(data.data || []);
        } else {
          console.error('Error fetching categories:', data.error);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [session]);

  // Fetch recipe book entries
  useEffect(() => {
    const fetchRecipeBook = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const url = selectedCategory 
          ? `/api/recipe-book?categoryId=${selectedCategory}`
          : '/api/recipe-book';
          
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          setRecipes(data.data || []);
        } else {
          throw new Error(data.error || 'Failed to fetch recipe book');
        }
      } catch (err) {
        console.error('Error fetching recipe book:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recipe book');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeBook();
  }, [session, selectedCategory]);

  // Filter and sort recipes
  useEffect(() => {
    let filtered = [...recipes];

    // Deduplicate recipes when viewing "All Recipes" (no category selected)
    if (!selectedCategory) {
      const recipeMap = new Map<string, RecipeBookRecipe>();
      
      filtered.forEach(recipe => {
        if (recipeMap.has(recipe.id)) {
          // Recipe already exists, aggregate categories
          const existingRecipe = recipeMap.get(recipe.id)!;
          if (recipe.category && !existingRecipe.categories?.some(cat => cat.id === recipe.category!.id)) {
            existingRecipe.categories = existingRecipe.categories || [];
            existingRecipe.categories.push(recipe.category);
          }
        } else {
          // First time seeing this recipe, add it with its category (if any)
          const recipeWithCategories = {
            ...recipe,
            categories: recipe.category ? [recipe.category] : []
          };
          delete recipeWithCategories.category; // Remove single category property
          recipeMap.set(recipe.id, recipeWithCategories);
        }
      });
      
      filtered = Array.from(recipeMap.values());
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(recipe => {
        try {
          return (
            recipe.title?.toLowerCase().includes(searchLower) ||
            recipe.description?.toLowerCase().includes(searchLower) ||
            (recipe.tags && Array.isArray(recipe.tags) && recipe.tags.some(tag => 
              tag && typeof tag === 'string' && tag.toLowerCase().includes(searchLower)
            )) ||
            (recipe.ingredients && Array.isArray(recipe.ingredients) && recipe.ingredients.some(ingredient => 
              ingredient && ingredient.ingredient && typeof ingredient.ingredient === 'string' && 
              ingredient.ingredient.toLowerCase().includes(searchLower)
            ))
          );
        } catch (error) {
          console.error('Error filtering recipe:', recipe.id, error);
          return false;
        }
      });
    }

    // Apply difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter(recipe => recipe.difficulty === selectedDifficulty);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case 'oldest':
          return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - 
                 difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
        default:
          return 0;
      }
    });

    setFilteredRecipes(filtered);
  }, [recipes, searchTerm, selectedDifficulty, sortBy, selectedCategory]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) return;
    
    try {
      const response = await fetch('/api/recipe-book/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null,
          color: newCategoryColor,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCategories(prev => [...prev, data.data]);
        setNewCategoryName('');
        setNewCategoryDescription('');
        setNewCategoryColor('#3B82F6');
        setShowAddCategoryModal(false);
      } else {
        alert(data.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDifficulty('');
    setSelectedCategory(null);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-green-700" />
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to sign-in
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <BookOpen className="w-8 h-8 text-green-700" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Recipe Book</h1>
              <p className="text-gray-600">
                Organize and manage your favorite recipes
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar - Categories */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Categories</h2>
                <button
                  onClick={() => setShowAddCategoryModal(true)}
                  className="p-1 text-green-700 hover:bg-green-100 rounded"
                  title="Add Category"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {categoriesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-1">
                  {/* All Recipes */}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory === null
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="w-4 h-4" />
                      <span>All Recipes</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {uniqueRecipeCount}
                    </span>
                  </button>

                  {/* Categories */}
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                        selectedCategory === category.id
                          ? 'bg-green-100 text-green-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color || '#3B82F6' }}
                        />
                        <span>{category.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {category.recipeCount}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search your recipe book..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                    />
                  </div>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 bg-white"
                  >
                    <option value="">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 bg-white"
                  >
                    <option value="newest">Recently Added</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">A-Z</option>
                    <option value="difficulty">Easiest First</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-green-700 text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors rounded-l-lg`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-green-700 text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors rounded-r-lg`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {(searchTerm || selectedDifficulty || selectedCategory) && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Filter className="w-4 h-4" />
                    <span>Filters active:</span>
                    {searchTerm && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        Search: "{searchTerm}"
                      </span>
                    )}
                    {selectedDifficulty && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded capitalize">
                        {selectedDifficulty}
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {categories.find(c => c.id === selectedCategory)?.name}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-green-700 hover:text-green-800 font-medium"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-700 mx-auto mb-4" />
                <p className="text-gray-600">Loading your recipe book...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Recipe Book</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {recipes.length === 0 ? "Your recipe book is empty" : "No recipes match your filters"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {recipes.length === 0
                    ? "Start adding recipes to organize your culinary collection!"
                    : "Try adjusting your search criteria or clearing the filters."}
                </p>
                <div className="flex justify-center space-x-4">
                  {(searchTerm || selectedDifficulty || selectedCategory) && (
                    <button
                      onClick={clearFilters}
                      className="border border-green-700 text-green-700 px-6 py-3 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                  <Link
                    href="/food-feed"
                    className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition-colors inline-flex items-center"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Discover Recipes
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Results Summary */}
                <div className="mb-6">
                  <p className="text-gray-600">
                    Showing {filteredRecipes.length} of {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
                    {selectedCategory && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
                  </p>
                </div>

                {/* Recipe Grid/List */}
                <div className={
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-6"
                }>
                  {filteredRecipes.map((recipe, index) => (
                    <div key={`${recipe.id}-${index}`} className="relative">
                      <RecipeCard 
                        recipe={recipe}
                        className={viewMode === 'list' ? 'flex' : ''}
                        showFavoriteButton={false} // Hide favorite button in recipe book view
                        showFollowButton={false} // Hide follow button in recipe book view
                        isFavorited={false}
                        onFavoriteToggle={async () => {}} // Not used
                      />
                      {/* Display single category for specific category view */}
                      {recipe.category && selectedCategory && (
                        <div className="absolute top-2 right-2">
                          <div 
                            className="px-2 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                            style={{ backgroundColor: recipe.category.color || '#3B82F6' }}
                          >
                            {recipe.category.name}
                          </div>
                        </div>
                      )}
                      {/* Display multiple categories for "All Recipes" view */}
                      {recipe.categories && !selectedCategory && recipe.categories.length > 0 && (
                        <div className="absolute top-2 right-2 space-y-1">
                          {recipe.categories.slice(0, 3).map((category, catIndex) => (
                            <div 
                              key={category.id}
                              className="px-2 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                              style={{ backgroundColor: category.color || '#3B82F6' }}
                            >
                              {category.name}
                            </div>
                          ))}
                          {recipe.categories.length > 3 && (
                            <div className="px-2 py-1 rounded-full text-xs font-medium text-white shadow-sm bg-gray-500">
                              +{recipe.categories.length - 3} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Category</h2>
            
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Desserts, Vegetarian, Quick Meals"
                  required
                />
              </div>

              <div>
                <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="categoryDescription"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Brief description of this category"
                  rows={2}
                />
              </div>

              <div>
                <label htmlFor="categoryColor" className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  id="categoryColor"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}