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
  const [totalUniqueRecipes, setTotalUniqueRecipes] = useState(0);
  
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [totalRecipeCount, setTotalRecipeCount] = useState(0);
  const itemsPerPage = 12;

  // Fetch recipe book stats for accurate "All Recipes" count
  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch('/api/recipe-book/stats');
        const data = await response.json();
        
        if (data.success) {
          setTotalUniqueRecipes(data.data.totalUniqueRecipes);
        } else {
          console.error('Error fetching recipe book stats:', data.error);
        }
      } catch (err) {
        console.error('Error fetching recipe book stats:', err);
      }
    };

    fetchStats();
  }, [session]);

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
          ? `/api/recipe-book?categoryId=${selectedCategory}&page=${currentPage}&limit=${itemsPerPage}`
          : `/api/recipe-book?page=${currentPage}&limit=${itemsPerPage}`;
          
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          setRecipes(data.data || []);
          
          // Update pagination state
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages);
            setHasNextPage(data.pagination.hasNextPage);
            setHasPrevPage(data.pagination.hasPrevPage);
            setTotalRecipeCount(data.pagination.total);
          }
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
  }, [session, selectedCategory, currentPage]);

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  // Filter and sort recipes
  useEffect(() => {
    let filtered = [...recipes];

    // No need to deduplicate anymore - API returns unique recipes when no category is selected

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

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the "${categoryName}" category? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/recipe-book/categories?categoryId=${categoryId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove category from state
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        
        // If deleted category was selected, reset to "All Recipes"
        if (selectedCategory === categoryId) {
          setSelectedCategory(null);
        }
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
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
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#B370B0' }} />
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to sign-in
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#CFE8EF' }}>
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <BookOpen className="w-8 h-8" style={{ color: '#B370B0' }} />
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
                  className="p-1 rounded transition-colors"
                  style={{ color: '#B370B0' }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(179, 112, 176, 0.1)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
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
                        ? 'text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={selectedCategory === null ? { backgroundColor: '#B370B0' } : {}}
                  >
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="w-4 h-4" />
                      <span>All Recipes</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {totalUniqueRecipes}
                    </span>
                  </button>

                  {/* Categories */}
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between group ${
                        selectedCategory === category.id
                          ? 'text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      style={selectedCategory === category.id ? { backgroundColor: '#B370B0' } : {}}
                    >
                      <button
                        onClick={() => setSelectedCategory(category.id)}
                        className="flex items-center space-x-2 flex-1"
                      >
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color || '#3B82F6' }}
                        />
                        <span>{category.name}</span>
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-500">
                          {category.recipeCount}
                        </span>
                        
                        {/* Show trash icon only for empty categories */}
                        {category.recipeCount === 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(category.id, category.name);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                            title="Delete empty category"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2"
                      style={{
                        '--tw-ring-color': '#B370B0'
                      } as React.CSSProperties}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#B370B0';
                        e.target.style.boxShadow = `0 0 0 2px rgba(179, 112, 176, 0.2)`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 bg-white"
                    style={{
                      '--tw-ring-color': '#B370B0'
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#B370B0';
                      e.target.style.boxShadow = `0 0 0 2px rgba(179, 112, 176, 0.2)`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
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
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 bg-white"
                    style={{
                      '--tw-ring-color': '#B370B0'
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#B370B0';
                      e.target.style.boxShadow = `0 0 0 2px rgba(179, 112, 176, 0.2)`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
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
                    className={`p-2 transition-colors rounded-l-lg ${
                      viewMode === 'grid' ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    style={viewMode === 'grid' ? { backgroundColor: '#B370B0' } : {}}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors rounded-r-lg ${
                      viewMode === 'list' ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    style={viewMode === 'list' ? { backgroundColor: '#B370B0' } : {}}
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
                      <span className="text-white px-2 py-1 rounded" style={{ backgroundColor: '#B370B0' }}>
                        Search: "{searchTerm}"
                      </span>
                    )}
                    {selectedDifficulty && (
                      <span className="text-white px-2 py-1 rounded capitalize" style={{ backgroundColor: '#B370B0' }}>
                        {selectedDifficulty}
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="text-white px-2 py-1 rounded" style={{ backgroundColor: '#B370B0' }}>
                        {categories.find(c => c.id === selectedCategory)?.name}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-sm font-medium hover:opacity-80"
                    style={{ color: '#B370B0' }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#B370B0' }} />
                <p className="text-gray-600">Loading your recipe book...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Recipe Book</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-white px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: '#B370B0' }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#A063A0'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#B370B0'}
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
                      className="border px-6 py-3 rounded-lg transition-colors"
                    style={{ 
                      borderColor: '#B370B0', 
                      color: '#B370B0' 
                    }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(179, 112, 176, 0.1)'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                    >
                      Clear Filters
                    </button>
                  )}
                  <Link
                    href="/food-feed"
                    className="text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center"
                    style={{ backgroundColor: '#B370B0' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#A063A0'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#B370B0'}
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Discover Recipes
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Results Summary */}
                <div className="mb-6 flex justify-between items-center">
                  <p className="text-gray-600">
                    {selectedCategory ? (
                      <>
                        Showing {filteredRecipes.length} of {totalRecipeCount} recipe{totalRecipeCount !== 1 ? 's' : ''}
                        {` in ${categories.find(c => c.id === selectedCategory)?.name}`}
                      </>
                    ) : (
                      <>
                        Showing {Math.min(itemsPerPage * currentPage, totalRecipeCount)} of {totalRecipeCount} recipe{totalRecipeCount !== 1 ? 's' : ''}
                        {currentPage > 1 && ` (Page ${currentPage})`}
                      </>
                    )}
                  </p>
                  
                  {/* View mode toggle */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid' ? 'text-white' : 'text-gray-400'}`}
                      style={viewMode === 'grid' ? { backgroundColor: '#B370B0' } : {}}
                      title="Grid view"
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list' ? 'text-white' : 'text-gray-400'}`}
                      style={viewMode === 'list' ? { backgroundColor: '#B370B0' } : {}}
                      title="List view"
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
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
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center space-x-4">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!hasPrevPage}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        hasPrevPage
                          ? 'text-white'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      style={hasPrevPage ? { backgroundColor: '#B370B0' } : {}}
                      onMouseEnter={(e) => {
                        if (hasPrevPage) (e.target as HTMLElement).style.backgroundColor = '#A063A0';
                      }}
                      onMouseLeave={(e) => {
                        if (hasPrevPage) (e.target as HTMLElement).style.backgroundColor = '#B370B0';
                      }}
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      {/* Show page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            style={currentPage === pageNum ? { backgroundColor: '#B370B0' } : {}}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={!hasNextPage}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        hasNextPage
                          ? 'text-white'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      style={hasNextPage ? { backgroundColor: '#B370B0' } : {}}
                      onMouseEnter={(e) => {
                        if (hasNextPage) (e.target as HTMLElement).style.backgroundColor = '#A063A0';
                      }}
                      onMouseLeave={(e) => {
                        if (hasNextPage) (e.target as HTMLElement).style.backgroundColor = '#B370B0';
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{
                    '--tw-ring-color': '#B370B0'
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#B370B0';
                    e.target.style.boxShadow = `0 0 0 2px rgba(179, 112, 176, 0.2)`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{
                    '--tw-ring-color': '#B370B0'
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#B370B0';
                    e.target.style.boxShadow = `0 0 0 2px rgba(179, 112, 176, 0.2)`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
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
                  className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{
                    '--tw-ring-color': '#B370B0'
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#B370B0';
                    e.target.style.boxShadow = `0 0 0 2px rgba(179, 112, 176, 0.2)`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
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
                  className="px-4 py-2 text-white rounded-md transition-colors"
                  style={{ backgroundColor: '#B370B0' }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#A063A0'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#B370B0'}
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