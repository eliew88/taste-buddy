/**
 * User Profile Page
 * 
 * Displays user information and their recipes.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, Mail, Calendar, ChefHat, Heart, Settings, Plus, Loader2 } from 'lucide-react';
import Navigation from '@/components/ui/Navigation';
import RecipeCard from '@/components/ui/recipe-card';

interface UserRecipe {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
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
  };
  avgRating?: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userRecipes, setUserRecipes] = useState<UserRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  // Fetch user's recipes
  useEffect(() => {
    const fetchUserRecipes = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        // For now, we'll fetch all recipes and filter client-side
        // In a real app, you'd have an API endpoint like /api/users/[id]/recipes
        const response = await fetch('/api/recipes');
        const data = await response.json();
        
        if (data.success) {
          // Filter recipes by current user
          const filtered = data.data.filter((recipe: UserRecipe) => 
            recipe.author.id === session.user.id
          );
          setUserRecipes(filtered);
        }
      } catch (error) {
        console.error('Error fetching user recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRecipes();
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
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
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-green-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{session.user?.name}</h1>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{session.user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {new Date().getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{userRecipes.length}</div>
              <div className="text-sm text-gray-600">Recipes Shared</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {userRecipes.reduce((sum, recipe) => sum + recipe._count.favorites, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {userRecipes.reduce((sum, recipe) => sum + recipe._count.ratings, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Ratings</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/recipes/new"
            className="bg-green-700 text-white p-4 rounded-lg hover:bg-green-800 transition-colors flex items-center space-x-3"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add New Recipe</span>
          </Link>
          <Link
            href="/profile/favorites"
            className="bg-white border border-gray-200 text-gray-700 p-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
          >
            <Heart className="w-5 h-5" />
            <span className="font-medium">My Favorites</span>
          </Link>
          <Link
            href="/food-feed"
            className="bg-white border border-gray-200 text-gray-700 p-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
          >
            <ChefHat className="w-5 h-5" />
            <span className="font-medium">Discover Recipes</span>
          </Link>
        </div>

        {/* User's Recipes */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Recipes</h2>
            {userRecipes.length > 0 && (
              <span className="text-sm text-gray-600">
                {userRecipes.length} recipe{userRecipes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-700 mx-auto mb-4" />
              <p className="text-gray-600">Loading your recipes...</p>
            </div>
          ) : userRecipes.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes yet</h3>
              <p className="text-gray-600 mb-6">
                Start sharing your culinary creations with the TasteBuddy community!
              </p>
              <Link
                href="/recipes/new"
                className="inline-flex items-center space-x-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Recipe</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}