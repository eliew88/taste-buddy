'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Heart, Star, Clock, Crown, Flame, BarChart3, Utensils } from 'lucide-react';
import { useRecipeStats } from '@/hooks/use-recipe-stats';
import { LoadingSpinner } from '@/components/ui/loading';

interface RecipeStatsProps {
  className?: string;
}

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color = 'blue' 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    purple: 'text-purple-600 bg-purple-50'
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-6 text-center`}>
      <Icon className={`w-8 h-8 mx-auto mb-3 text-${color}-600`} />
      <div className={`text-2xl font-bold text-${color}-800 mb-1`}>{value}</div>
      <div className={`text-sm text-${color}-700`}>{label}</div>
    </div>
  );
};


export default function RecipeStatsSection({ className = '' }: RecipeStatsProps) {
  const { stats, loading, error } = useRecipeStats();

  if (loading) {
    return (
      <section className={`py-16 bg-gray-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading recipe statistics...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !stats) {
    return (
      <section className={`py-16 bg-gray-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center text-red-600">
            <p>Unable to load statistics: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-16 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            TasteBuddy Stats
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See the most loved recipes and explore the latest additions to our community.
          </p>
        </div>

        {/* Platform Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-16">
          <StatCard 
            icon={BarChart3} 
            label="Total Recipes" 
            value={stats.platformStats.totalRecipes.toLocaleString()} 
            color="green" 
          />
          <StatCard 
            icon={Utensils} 
            label="Total Meals" 
            value={stats.platformStats.totalMeals.toLocaleString()} 
            color="blue" 
          />
          <StatCard 
            icon={Heart} 
            label="Recipe Favorites" 
            value={stats.platformStats.totalFavorites.toLocaleString()} 
            color="red" 
          />
          <StatCard 
            icon={Star} 
            label="Recipe Ratings" 
            value={stats.platformStats.totalRatings.toLocaleString()} 
            color="yellow" 
          />
          <StatCard 
            icon={Users} 
            label="Community Members" 
            value={stats.platformStats.totalUsers.toLocaleString()} 
            color="purple" 
          />
        </div>

        {/* Recipe Collections */}
        <div className="grid lg:grid-cols-3 gap-12 mb-16">
          {/* Most Popular */}
          <div>
            <div className="flex items-center mb-6">
              <Flame className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Most Popular</h3>
            </div>
            <div className="space-y-4">
              {stats.mostPopular.slice(0, 3).map((recipe, index) => (
                <div key={recipe.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/recipes/${recipe.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors truncate block"
                    >
                      {recipe.title}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {recipe._count?.favorites || 0} favorites • by {recipe.author.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link 
              href="/food-feed?sort=popular" 
              className="inline-block mt-4 text-red-600 hover:text-red-700 text-sm font-medium"
            >
              View all popular recipes →
            </Link>
          </div>

          {/* Newest */}
          <div>
            <div className="flex items-center mb-6">
              <Clock className="w-6 h-6 text-blue-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Latest Additions</h3>
            </div>
            <div className="space-y-4">
              {stats.newest.slice(0, 3).map((recipe, index) => (
                <div key={recipe.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/recipes/${recipe.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors truncate block"
                    >
                      {recipe.title}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {new Date(recipe.createdAt).toLocaleDateString()} • by {recipe.author.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link 
              href="/food-feed?sort=newest" 
              className="inline-block mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all new recipes →
            </Link>
          </div>

          {/* Highest Rated */}
          <div>
            <div className="flex items-center mb-6">
              <Crown className="w-6 h-6 text-yellow-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Top Rated</h3>
            </div>
            <div className="space-y-4">
              {stats.highestRated.slice(0, 3).map((recipe, index) => (
                <div key={recipe.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-bold text-sm">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/recipes/${recipe.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-yellow-600 transition-colors truncate block"
                    >
                      {recipe.title}
                    </Link>
                    <div className="flex items-center text-xs text-gray-500">
                      <Star className="w-3 h-3 text-yellow-400 mr-1" />
                      <span>{recipe.avgRating.toFixed(1)} • {recipe._count?.ratings || 0} ratings</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link 
              href="/food-feed?sort=rating" 
              className="inline-block mt-4 text-yellow-600 hover:text-yellow-700 text-sm font-medium"
            >
              View all top rated →
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}