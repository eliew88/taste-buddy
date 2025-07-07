'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Star, Heart, Plus, Clock, Users, ChefHat, AlertCircle } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string;
  cookTime?: string;
  servings?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  author: {
    id: string;
    name: string;
    email: string;
  };
  avgRating?: number;
  _count?: {
    favorites: number;
    ratings: number;
  };
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  data: Recipe[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  error?: string;
}

const StarRating = ({ rating, onRate, interactive = true }: { 
  rating: number; 
  onRate?: (rating: number) => void; 
  interactive?: boolean; 
}) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
          onClick={() => interactive && onRate && onRate(star)}
        />
      ))}
    </div>
  );
};

const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const handleFavorite = async () => {
    try {
      // TODO: Implement favorite API call
      setIsFavorite(!isFavorite);
      console.log('Toggle favorite for recipe:', recipe.id);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleRating = async (rating: number) => {
    try {
      // TODO: Implement rating API call
      setUserRating(rating);
      console.log('Rate recipe:', recipe.id, 'Rating:', rating);
    } catch (error) {
      console.error('Failed to rate recipe:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <Link href={`/recipes/${recipe.id}`}>
            <h3 className="text-xl font-semibold text-gray-800 hover:text-blue-600 cursor-pointer">
              {recipe.title}
            </h3>
          </Link>
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-full ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''}`} />
          </button>
        </div>
        
        <p className="text-gray-600 mb-3">By {recipe.author.name}</p>
        
        {recipe.description && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-2">{recipe.description}</p>
        )}
        
        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
          {recipe.cookTime && (
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {recipe.cookTime}
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {recipe.servings} servings
            </div>
          )}
          <div className="flex items-center">
            <ChefHat className="w-4 h-4 mr-1" />
            {recipe.difficulty}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
              >
                {ingredient.length > 15 ? ingredient.substring(0, 15) + '...' : ingredient}
              </span>
            ))}
            {recipe.ingredients.length > 3 && (
              <span className="text-gray-500 text-xs">+{recipe.ingredients.length - 3} more</span>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {recipe.tags.slice(0, 4).map((tag, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                {tag}
              </span>
            ))}
            {recipe.tags.length > 4 && (
              <span className="text-gray-500 text-xs">+{recipe.tags.length - 4} more</span>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <StarRating rating={userRating} onRate={handleRating} />
            <span className="text-sm text-gray-600">
              {recipe.avgRating ? recipe.avgRating.toFixed(1) : '0.0'} 
              ({recipe._count?.ratings || 0} reviews)
            </span>
          </div>
        </div>
        
        <p className="text-xs text-gray-500">
          Created {formatDate(recipe.createdAt)}
        </p>
      </div>
    </div>
  );
};

const ErrorMessage = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
    <p className="text-red-700 mb-2">{message}</p>
    <button
      onClick={onRetry}
      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
    >
      Try Again
    </button>
  </div>
);

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchRecipes = async (page = 1, search = searchTerm, diff = difficulty) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });
      
      if (search.trim()) {
        params.append('search', search.trim());
      }
      
      if (diff) {
        params.append('difficulty', diff);
      }

      const response = await fetch(`/api/recipes?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setRecipes(data.data);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch recipes');
      }
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch recipes');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes(1, searchTerm, difficulty);
  }, [searchTerm, difficulty]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    fetchRecipes(newPage, searchTerm, difficulty);
  };

  const retryFetch = () => {
    fetchRecipes(pagination.page, searchTerm, difficulty);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              TasteBuddy
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link href="/profile/favorites" className="flex items-center text-gray-600 hover:text-gray-900">
                <Heart className="w-4 h-4 mr-1" />
                Favorites
              </Link>
              <Link href="/recipes/search" className="text-gray-600 hover:text-gray-900">
                Browse
              </Link>
              <Link href="/recipes/new" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center">
                <Plus className="w-4 h-4 mr-1" />
                Add Recipe
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Your Personal Recipe
            <span className="text-blue-600"> Companion</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover, cook, and share amazing recipes with TasteBuddy
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/recipes/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Share a Recipe
            </Link>
            <Link 
              href="/recipes/search"
              className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50"
            >
              Explore Recipes
            </Link>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipes, ingredients, or tags..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex justify-center">
            <select
              value={difficulty}
              onChange={(e) => handleDifficultyChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Recipes Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {searchTerm || difficulty ? 'Search Results' : 'Featured Recipes'} 
              {!loading && ` (${pagination.total})`}
            </h2>
            
            {(searchTerm || difficulty) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDifficulty('');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading delicious recipes...</p>
            </div>
          ) : error ? (
            <ErrorMessage message={error} onRetry={retryFetch} />
          ) : (
            <>
              {recipes.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {recipes.map(recipe => (
                      <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrevPage}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      
                      <span className="px-4 py-2 text-gray-600">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNextPage}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Search className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No recipes found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || difficulty 
                      ? "Try adjusting your search criteria or clear the filters." 
                      : "Be the first to share a recipe with the community!"
                    }
                  </p>
                  <Link 
                    href="/recipes/new"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 inline-flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Recipe
                  </Link>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}