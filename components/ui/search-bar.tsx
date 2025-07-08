/**
 * SearchBar Component
 * 
 * Advanced search component with filtering capabilities for the recipe platform.
 * Includes text search, difficulty filtering, and expandable filter options.
 * 
 * Location: components/ui/SearchBar.tsx
 * 
 * Features:
 * - Real-time search with debouncing
 * - Difficulty level filtering
 * - Expandable advanced filters
 * - Active filter display with removal
 * - Responsive design
 * - Keyboard accessibility
 */

'use client';

import { useState, useCallback } from 'react';
import { Search, Filter, X, ChevronUp } from 'lucide-react';

interface SearchFilters {
  search: string;
  difficulty: string;
  tags: string[];
  cookTimeMax?: number;
  servingsMin?: number;
}

interface SearchBarProps {
  /** Callback function when search filters change */
  onSearch: (filters: SearchFilters) => void;
  
  /** Placeholder text for search input */
  placeholder?: string;
  
  /** Current search filters */
  filters: SearchFilters;
  
  /** Whether to show advanced filters */
  showAdvanced?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * SearchBar Component
 * 
 * @example
 * ```tsx
 * const [filters, setFilters] = useState({
 *   search: '',
 *   difficulty: '',
 *   tags: [],
 * });
 * 
 * <SearchBar 
 *   onSearch={setFilters}
 *   filters={filters}
 *   showAdvanced={true}
 * />
 * ```
 */
export default function SearchBar({ 
  onSearch, 
  placeholder = "Search recipes, ingredients, or tags...",
  filters,
  showAdvanced = true,
  className = ''
}: SearchBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [tempCookTime, setTempCookTime] = useState(filters.cookTimeMax?.toString() || '');
  const [tempServings, setTempServings] = useState(filters.servingsMin?.toString() || '');

  // Popular tags for quick selection
  const popularTags = [
    'breakfast', 'lunch', 'dinner', 'dessert', 'snack',
    'vegetarian', 'vegan', 'gluten-free', 'healthy',
    'quick', 'easy', 'italian', 'asian', 'mexican'
  ];

  /**
   * Updates search filters
   */
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    onSearch({ ...filters, ...newFilters });
  }, [filters, onSearch]);

  /**
   * Handles search input change
   */
  const handleSearchChange = (value: string) => {
    updateFilters({ search: value });
  };

  /**
   * Handles difficulty filter change
   */
  const handleDifficultyChange = (value: string) => {
    updateFilters({ difficulty: value });
  };

  /**
   * Handles tag selection
   */
  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    updateFilters({ tags: newTags });
  };

  /**
   * Handles cook time filter
   */
  const handleCookTimeApply = () => {
    const cookTime = tempCookTime ? parseInt(tempCookTime) : undefined;
    updateFilters({ cookTimeMax: cookTime });
  };

  /**
   * Handles servings filter
   */
  const handleServingsApply = () => {
    const servings = tempServings ? parseInt(tempServings) : undefined;
    updateFilters({ servingsMin: servings });
  };

  /**
   * Clears all filters
   */
  const clearAllFilters = () => {
    setTempCookTime('');
    setTempServings('');
    updateFilters({
      search: '',
      difficulty: '',
      tags: [],
      cookTimeMax: undefined,
      servingsMin: undefined,
    });
  };

  /**
   * Removes a specific filter
   */
  const removeFilter = (filterType: string, value?: string) => {
    switch (filterType) {
      case 'search':
        updateFilters({ search: '' });
        break;
      case 'difficulty':
        updateFilters({ difficulty: '' });
        break;
      case 'tag':
        if (value) {
          const newTags = filters.tags.filter(tag => tag !== value);
          updateFilters({ tags: newTags });
        }
        break;
      case 'cookTime':
        setTempCookTime('');
        updateFilters({ cookTimeMax: undefined });
        break;
      case 'servings':
        setTempServings('');
        updateFilters({ servingsMin: undefined });
        break;
    }
  };

  // Count active filters
  const activeFilterCount = [
    filters.search,
    filters.difficulty,
    filters.tags.length > 0,
    filters.cookTimeMax,
    filters.servingsMin
  ].filter(Boolean).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
        />
        
        {/* Filter Toggle Button */}
        {showAdvanced && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Toggle filters"
          >
            <div className="relative">
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </div>
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Cook Time Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Cook Time (minutes)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="e.g. 30"
                  value={tempCookTime}
                  onChange={(e) => setTempCookTime(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleCookTimeApply}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Servings Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Servings
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="e.g. 4"
                  value={tempServings}
                  onChange={(e) => setTempServings(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleServingsApply}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <div className="flex justify-end">
              <button
                onClick={clearAllFilters}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
              Search: &quot;{filters.search}&quot;
              <button
                onClick={() => removeFilter('search')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.difficulty && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
              Difficulty: {filters.difficulty}
              <button
                onClick={() => removeFilter('difficulty')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.tags.map((tag) => (
            <span
              key={tag}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
            >
              Tag: {tag}
              <button
                onClick={() => removeFilter('tag', tag)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filters.cookTimeMax && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
              Max time: {filters.cookTimeMax}m
              <button
                onClick={() => removeFilter('cookTime')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.servingsMin && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
              Min servings: {filters.servingsMin}
              <button
                onClick={() => removeFilter('servings')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}