/**
 * Advanced Search Filters Component
 * 
 * Comprehensive filtering interface for the FoodFeed search page.
 * Includes collapsible sections, range sliders, multi-select options,
 * and real-time filter application.
 * 
 * @file components/ui/AdvancedSearchFilters.tsx
 */

'use client';

import React, { useState, useCallback } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  X, 
  Filter,
  Clock,
  Users,
  Star,
  Calendar,
  ChefHat,
  Tag,
  Utensils
} from 'lucide-react';

/**
 * Enhanced search filter interfaces
 */
interface SearchFilters {
  difficulty: string[];
  ingredients: string[];
  tags: string[];
  cookTimeRange: [number, number];
  servingsRange: [number, number];
  minRating: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

interface FilterOptions {
  difficulties: Array<{ value: string; label: string; count: number }>;
  popularIngredients: Array<{ name: string; count: number }>;
  tags: Array<{ name: string; count: number }>;
  cookTimeStats: { min: number; max: number; average: number };
  servingsStats: { min: number; max: number; average: number };
}

interface AdvancedSearchFiltersProps {
  /** Current filter values */
  filters: SearchFilters;
  
  /** Callback when filters change */
  onFiltersChange: (filters: SearchFilters) => void;
  
  /** Available filter options from the API */
  filterOptions?: FilterOptions;
  
  /** Whether filters are loading */
  loading?: boolean;
  
  /** Callback to reset all filters */
  onResetFilters: () => void;
  
  /** Number of active filters */
  activeFilterCount: number;
}

/**
 * Individual collapsible filter section
 */
interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badgeCount?: number;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  badgeCount,
}) => (
  <div className="border-b border-gray-200 last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      aria-expanded={isOpen}
    >
      <div className="flex items-center space-x-3">
        <div className="text-gray-500">{icon}</div>
        <span className="font-medium text-gray-900">{title}</span>
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
            {badgeCount}
          </span>
        )}
      </div>
      {isOpen ? (
        <ChevronUp className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      )}
    </button>
    
    {isOpen && (
      <div className="px-4 pb-4">
        {children}
      </div>
    )}
  </div>
);

/**
 * Multi-select checkbox group component
 */
interface MultiSelectProps {
  options: Array<{ value: string; label: string; count?: number }>;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options...",
}) => {
  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {options.length === 0 ? (
        <p className="text-sm text-gray-500 italic">{placeholder}</p>
      ) : (
        options.map(option => (
          <label
            key={option.value}
            className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleToggle(option.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 capitalize">{option.label}</span>
            </div>
            {option.count !== undefined && (
              <span className="text-xs text-gray-500">({option.count})</span>
            )}
          </label>
        ))
      )}
    </div>
  );
};

/**
 * Range slider component with dual handles
 */
interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  unit?: string;
  formatValue?: (value: number) => string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  step = 1,
  unit = '',
  formatValue = (v) => `${v}${unit}`,
}) => {
  const handleMinChange = (newMin: number) => {
    const clampedMin = Math.min(newMin, value[1]);
    onChange([clampedMin, value[1]]);
  };

  const handleMaxChange = (newMax: number) => {
    const clampedMax = Math.max(newMax, value[0]);
    onChange([value[0], clampedMax]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-600">
        <span>{formatValue(value[0])}</span>
        <span>{formatValue(value[1])}</span>
      </div>
      
      <div className="relative h-6">
        {/* Track */}
        <div className="absolute top-3 left-0 right-0 h-1 bg-gray-200 rounded"></div>
        
        {/* Active range */}
        <div 
          className="absolute top-3 h-1 bg-blue-500 rounded"
          style={{
            left: `${((value[0] - min) / (max - min)) * 100}%`,
            width: `${((value[1] - value[0]) / (max - min)) * 100}%`
          }}
        ></div>
        
        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => handleMinChange(parseInt(e.target.value))}
          className="absolute w-full h-6 opacity-0 cursor-pointer"
        />
        
        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => handleMaxChange(parseInt(e.target.value))}
          className="absolute w-full h-6 opacity-0 cursor-pointer"
        />
        
        {/* Min handle */}
        <div
          className="absolute top-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-md cursor-pointer transform -translate-x-1/2"
          style={{ left: `${((value[0] - min) / (max - min)) * 100}%` }}
        ></div>
        
        {/* Max handle */}
        <div
          className="absolute top-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-md cursor-pointer transform -translate-x-1/2"
          style={{ left: `${((value[1] - min) / (max - min)) * 100}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
};

/**
 * Star rating filter component
 */
interface StarRatingFilterProps {
  value: number;
  onChange: (rating: number) => void;
}

const StarRatingFilter: React.FC<StarRatingFilterProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-3">Minimum rating</p>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onChange(star === value ? 0 : star)}
            className={`p-1 rounded transition-colors ${
              star <= value 
                ? 'text-yellow-400 hover:text-yellow-500' 
                : 'text-gray-300 hover:text-gray-400'
            }`}
            aria-label={`${star} star${star > 1 ? 's' : ''} or more`}
          >
            <Star 
              className="w-6 h-6" 
              fill={star <= value ? 'currentColor' : 'none'}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {value > 0 ? `${value}+ stars` : 'Any rating'}
        </span>
      </div>
    </div>
  );
};

/**
 * Main Advanced Search Filters Component
 */
export default function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  filterOptions,
  loading = false,
  onResetFilters,
  activeFilterCount,
}: AdvancedSearchFiltersProps) {
  // Collapsible section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    difficulty: true,
    cookTime: false,
    servings: false,
    rating: false,
    ingredients: false,
    tags: false,
    date: false,
  });

  const toggleSection = useCallback((section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // Filter update helpers
  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  }, [filters, onFiltersChange]);

  const formatCookTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Filter Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          
          {activeFilterCount > 0 && (
            <button
              onClick={onResetFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Sections */}
      <div className="divide-y divide-gray-200">
        {/* Difficulty Filter */}
        <FilterSection
          title="Difficulty"
          icon={<ChefHat className="w-4 h-4" />}
          isOpen={openSections.difficulty}
          onToggle={() => toggleSection('difficulty')}
          badgeCount={filters.difficulty.length}
        >
          <MultiSelect
            options={filterOptions?.difficulties || [
              { value: 'easy', label: 'Easy', count: 0 },
              { value: 'medium', label: 'Medium', count: 0 },
              { value: 'hard', label: 'Hard', count: 0 },
            ]}
            selectedValues={filters.difficulty}
            onChange={(values) => updateFilters({ difficulty: values })}
            placeholder="No difficulty options available"
          />
        </FilterSection>

        {/* Cook Time Filter */}
        <FilterSection
          title="Cook Time"
          icon={<Clock className="w-4 h-4" />}
          isOpen={openSections.cookTime}
          onToggle={() => toggleSection('cookTime')}
          badgeCount={filters.cookTimeRange[0] > (filterOptions?.cookTimeStats.min || 0) || 
                     filters.cookTimeRange[1] < (filterOptions?.cookTimeStats.max || 300) ? 1 : 0}
        >
          <RangeSlider
            min={filterOptions?.cookTimeStats.min || 5}
            max={filterOptions?.cookTimeStats.max || 300}
            value={filters.cookTimeRange}
            onChange={(value) => updateFilters({ cookTimeRange: value })}
            step={5}
            formatValue={formatCookTime}
          />
        </FilterSection>

        {/* Servings Filter */}
        <FilterSection
          title="Servings"
          icon={<Users className="w-4 h-4" />}
          isOpen={openSections.servings}
          onToggle={() => toggleSection('servings')}
          badgeCount={filters.servingsRange[0] > (filterOptions?.servingsStats.min || 1) || 
                     filters.servingsRange[1] < (filterOptions?.servingsStats.max || 12) ? 1 : 0}
        >
          <RangeSlider
            min={filterOptions?.servingsStats.min || 1}
            max={filterOptions?.servingsStats.max || 12}
            value={filters.servingsRange}
            onChange={(value) => updateFilters({ servingsRange: value })}
            step={1}
            formatValue={(v) => `${v} serving${v !== 1 ? 's' : ''}`}
          />
        </FilterSection>

        {/* Rating Filter */}
        <FilterSection
          title="Rating"
          icon={<Star className="w-4 h-4" />}
          isOpen={openSections.rating}
          onToggle={() => toggleSection('rating')}
          badgeCount={filters.minRating > 0 ? 1 : 0}
        >
          <StarRatingFilter
            value={filters.minRating}
            onChange={(rating) => updateFilters({ minRating: rating })}
          />
        </FilterSection>

        {/* Ingredients Filter */}
        <FilterSection
          title="Popular Ingredients"
          icon={<Utensils className="w-4 h-4" />}
          isOpen={openSections.ingredients}
          onToggle={() => toggleSection('ingredients')}
          badgeCount={filters.ingredients.length}
        >
          <MultiSelect
            options={filterOptions?.popularIngredients.map(ing => ({
              value: ing.name,
              label: ing.name,
              count: ing.count,
            })) || []}
            selectedValues={filters.ingredients}
            onChange={(values) => updateFilters({ ingredients: values })}
            placeholder="No popular ingredients available"
          />
        </FilterSection>

        {/* Tags Filter */}
        <FilterSection
          title="Tags"
          icon={<Tag className="w-4 h-4" />}
          isOpen={openSections.tags}
          onToggle={() => toggleSection('tags')}
          badgeCount={filters.tags.length}
        >
          <MultiSelect
            options={filterOptions?.tags.map(tag => ({
              value: tag.name,
              label: tag.name,
              count: tag.count,
            })) || []}
            selectedValues={filters.tags}
            onChange={(values) => updateFilters({ tags: values })}
            placeholder="No tags available"
          />
        </FilterSection>

        {/* Date Range Filter */}
        <FilterSection
          title="Date Range"
          icon={<Calendar className="w-4 h-4" />}
          isOpen={openSections.date}
          onToggle={() => toggleSection('date')}
          badgeCount={filters.dateRange.start || filters.dateRange.end ? 1 : 0}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created after
              </label>
              <input
                type="date"
                value={filters.dateRange.start || ''}
                onChange={(e) => updateFilters({
                  dateRange: { ...filters.dateRange, start: e.target.value || null }
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created before
              </label>
              <input
                type="date"
                value={filters.dateRange.end || ''}
                onChange={(e) => updateFilters({
                  dateRange: { ...filters.dateRange, end: e.target.value || null }
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {(filters.dateRange.start || filters.dateRange.end) && (
              <button
                onClick={() => updateFilters({
                  dateRange: { start: null, end: null }
                })}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <X className="w-3 h-3" />
                <span>Clear date range</span>
              </button>
            )}
          </div>
        </FilterSection>
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.difficulty.map(diff => (
              <span
                key={diff}
                className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full"
              >
                <span className="capitalize">{diff}</span>
                <button
                  onClick={() => updateFilters({
                    difficulty: filters.difficulty.filter(d => d !== diff)
                  })}
                  className="hover:text-blue-900 transition-colors"
                  aria-label={`Remove ${diff} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {filters.ingredients.map(ingredient => (
              <span
                key={ingredient}
                className="inline-flex items-center space-x-1 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full"
              >
                <span>{ingredient}</span>
                <button
                  onClick={() => updateFilters({
                    ingredients: filters.ingredients.filter(i => i !== ingredient)
                  })}
                  className="hover:text-green-900 transition-colors"
                  aria-label={`Remove ${ingredient} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {filters.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center space-x-1 bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full"
              >
                <span>{tag}</span>
                <button
                  onClick={() => updateFilters({
                    tags: filters.tags.filter(t => t !== tag)
                  })}
                  className="hover:text-purple-900 transition-colors"
                  aria-label={`Remove ${tag} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {filters.minRating > 0 && (
              <span className="inline-flex items-center space-x-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                <span>{filters.minRating}+ stars</span>
                <button
                  onClick={() => updateFilters({ minRating: 0 })}
                  className="hover:text-yellow-900 transition-colors"
                  aria-label="Remove rating filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {(filters.cookTimeRange[0] > (filterOptions?.cookTimeStats.min || 0) || 
              filters.cookTimeRange[1] < (filterOptions?.cookTimeStats.max || 300)) && (
              <span className="inline-flex items-center space-x-1 bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">
                <span>
                  {formatCookTime(filters.cookTimeRange[0])}-{formatCookTime(filters.cookTimeRange[1])}
                </span>
                <button
                  onClick={() => updateFilters({ 
                    cookTimeRange: [filterOptions?.cookTimeStats.min || 0, filterOptions?.cookTimeStats.max || 300] 
                  })}
                  className="hover:text-indigo-900 transition-colors"
                  aria-label="Remove cook time filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {(filters.servingsRange[0] > (filterOptions?.servingsStats.min || 1) || 
              filters.servingsRange[1] < (filterOptions?.servingsStats.max || 12)) && (
              <span className="inline-flex items-center space-x-1 bg-pink-100 text-pink-800 text-xs font-medium px-2 py-1 rounded-full">
                <span>
                  {filters.servingsRange[0]}-{filters.servingsRange[1]} servings
                </span>
                <button
                  onClick={() => updateFilters({ 
                    servingsRange: [filterOptions?.servingsStats.min || 1, filterOptions?.servingsStats.max || 12] 
                  })}
                  className="hover:text-pink-900 transition-colors"
                  aria-label="Remove servings filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {(filters.dateRange.start || filters.dateRange.end) && (
              <span className="inline-flex items-center space-x-1 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                <span>
                  {filters.dateRange.start && filters.dateRange.end
                    ? `${filters.dateRange.start} to ${filters.dateRange.end}`
                    : filters.dateRange.start
                    ? `After ${filters.dateRange.start}`
                    : `Before ${filters.dateRange.end}`}
                </span>
                <button
                  onClick={() => updateFilters({
                    dateRange: { start: null, end: null }
                  })}
                  className="hover:text-gray-900 transition-colors"
                  aria-label="Remove date range filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}