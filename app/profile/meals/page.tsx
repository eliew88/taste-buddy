/**
 * Meal Journal Page
 * 
 * Displays the user's meal memories with search and filter capabilities.
 * Shows meals ordered by recency with pagination support.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Utensils, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Loader2, 
  AlertCircle, 
  Plus,
  Calendar,
  Clock
} from 'lucide-react';
import Navigation from '@/components/ui/Navigation';
import MealCard from '@/components/ui/meal-card';
import { useMealSearch } from '@/hooks/use-meals';

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'name';

export default function MealJournalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Use the meal search hook for comprehensive state management
  const {
    meals,
    loading,
    error,
    pagination,
    searchTerm,
    dateFrom,
    dateTo,
    handleSearch,
    handleDateChange,
    handlePageChange,
    clearFilters,
    resetError
  } = useMealSearch();
  
  // UI state
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

  // Sort meals locally based on sort option
  const sortedMeals = [...meals].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const hasActiveFilters = searchTerm || dateFrom || dateTo;

  if (status === 'loading') {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Utensils className="w-8 h-8 text-orange-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Meal Journal</h1>
                <p className="text-gray-600">
                  {pagination.total} meal{pagination.total !== 1 ? 's' : ''} in your journal
                </p>
              </div>
            </div>
            
            {/* Add Meal Button */}
            <Link
              href="/meals/new"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Meal
            </Link>
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
                  placeholder="Search your meals..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                />
              </div>
            </div>

            {/* Date Filters */}
            <div className="flex gap-2">
              <div>
                <input
                  type="date"
                  placeholder="From date"
                  value={dateFrom?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateChange('from', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white"
                />
              </div>
              <div>
                <input
                  type="date"
                  placeholder="To date"
                  value={dateTo?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateChange('to', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">A-Z</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors rounded-l-lg`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors rounded-r-lg`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Filter className="w-4 h-4" />
                <span>Filters active:</span>
                {searchTerm && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    Search: &quot;{searchTerm}&quot;
                  </span>
                )}
                {dateFrom && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    From: {dateFrom.toLocaleDateString()}
                  </span>
                )}
                {dateTo && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    To: {dateTo.toLocaleDateString()}
                  </span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your meals...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Meals</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={resetError}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : sortedMeals.length === 0 ? (
          <div className="text-center py-16">
            <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {meals.length === 0 ? "No meals yet" : "No meals match your filters"}
            </h3>
            <p className="text-gray-600 mb-6">
              {meals.length === 0
                ? "Start capturing your meal memories!"
                : "Try adjusting your search criteria or clearing the filters."}
            </p>
            <div className="flex justify-center space-x-4">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="border border-orange-600 text-orange-600 px-6 py-3 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <Link
                href="/meals/new"
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Your First Meal
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {sortedMeals.length} of {pagination.total} meal{pagination.total !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Meal Grid/List */}
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-6"
            }>
              {sortedMeals.map((meal) => (
                <div key={meal.id} className="relative">
                  <MealCard 
                    meal={meal}
                    className={viewMode === 'list' ? 'flex' : ''}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}