/**
 * Favorites Page
 * 
 * Displays the user's favorited recipes with management capabilities.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Search, Filter, Grid3X3, List, Loader2, AlertCircle } from 'lucide-react';
import Navigation from '@/components/ui/Navigation';
import RecipeCard from '@/components/ui/recipe-card';
import { useFavorites } from '@/hooks/use-favorites';
import { IngredientEntry } from '@/types/recipe';

interface FavoriteRecipe {
  id: string;
  title: string;
  description?: string;
  ingredients: IngredientEntry[];
  instructions: string;
  cookTime?: string;
  servings?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  image?: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    favorites: number;
    ratings: number;
    comments: number;
  };
  avgRating?: number;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'title' | 'difficulty';

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Use the favorites hook for consistent state management
  const { isFavorited, toggleFavorite } = useFavorites();
  
  // State management
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  // Fetch user's favorite recipes
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/users/favorites');
        const data = await response.json();
        
        if (data.success) {
          console.log('Favorites data received:', data.data);
          setFavorites(data.data || []);
        } else {
          throw new Error(data.error || 'Failed to fetch favorites');
        }
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError(err instanceof Error ? err.message : 'Failed to load favorites');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [session]);

  // Filter and sort favorites
  useEffect(() => {
    let filtered = [...favorites];

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
          return false; // Exclude recipes that cause errors
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
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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

    setFilteredFavorites(filtered);
  }, [favorites, searchTerm, selectedDifficulty, sortBy]);

  const handleFavoriteToggle = async (recipeId: string) => {
    // Use the global favorites hook to toggle favorite status
    const isFavoritedAfterToggle = await toggleFavorite(recipeId);
    
    // If the recipe is no longer favorited, remove it from the local favorites list
    if (!isFavoritedAfterToggle) {
      setFavorites(prev => prev.filter(recipe => recipe.id !== recipeId));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDifficulty('');
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
    <div className="min-h-screen">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
              <p className="text-gray-600">
                {favorites.length} recipe{favorites.length !== 1 ? 's' : ''} you&apos;ve saved
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your favorites..."
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
                <option value="newest">Newest First</option>
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
          {(searchTerm || selectedDifficulty) && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Filter className="w-4 h-4" />
                <span>Filters active:</span>
                {searchTerm && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Search: &quot;{searchTerm}&quot;
                  </span>
                )}
                {selectedDifficulty && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded capitalize">
                    {selectedDifficulty}
                  </span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-purple-700 hover:text-purple-800 font-medium"
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
            <p className="text-gray-600">Loading your favorites...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Favorites</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {favorites.length === 0 ? "No favorites yet" : "No recipes match your filters"}
            </h3>
            <p className="text-gray-600 mb-6">
              {favorites.length === 0
                ? "Start exploring recipes and save your favorites!"
                : "Try adjusting your search criteria or clearing the filters."}
            </p>
            <div className="flex justify-center space-x-4">
              {(searchTerm || selectedDifficulty) && (
                <button
                  onClick={clearFilters}
                  className="border border-purple-700 text-purple-700 px-6 py-3 rounded-lg hover:bg-purple-100 transition-colors"
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
                Showing {filteredFavorites.length} of {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Recipe Grid/List */}
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-6"
            }>
              {filteredFavorites.map((recipe) => (
                <div key={recipe.id} className="relative">
                  <RecipeCard 
                    recipe={recipe}
                    className={viewMode === 'list' ? 'flex' : ''}
                    showFavoriteButton={true}
                    isFavorited={isFavorited(recipe.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}