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
  Utensils,
  Heart,
  Shield
} from 'lucide-react';

/**
 * Enhanced search filter interfaces
 */
type RecipePosterFilter = 'everyone' | 'following' | 'my-own';

interface SearchFilters {
  difficulty: string[];
  ingredients: string[];
  excludedIngredients: string[];
  tags: string[];
  cookTimeRange: [number, number];
  servingsRange: [number, number];
  minRating: number;
  recipePoster: RecipePosterFilter;
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
          <span className="text-white text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#B370B0' }}>
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
                className="rounded border-gray-300"
                style={{ accentColor: '#B370B0' }}
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
          className="absolute top-3 h-1 rounded"
          style={{
            backgroundColor: '#B370B0',
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
          className="absolute top-2 w-3 h-3 rounded-full border-2 border-white shadow-md cursor-pointer transform -translate-x-1/2"
          style={{ backgroundColor: '#B370B0', left: `${((value[0] - min) / (max - min)) * 100}%` }}
        ></div>
        
        {/* Max handle */}
        <div
          className="absolute top-2 w-3 h-3 rounded-full border-2 border-white shadow-md cursor-pointer transform -translate-x-1/2"
          style={{ backgroundColor: '#B370B0', left: `${((value[1] - min) / (max - min)) * 100}%` }}
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
    recipePoster: true,
    difficulty: true,
    rating: false,
    ingredients: false,
    excludedIngredients: false,
    tags: false,
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
              <span className="text-white text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#B370B0' }}>
                {activeFilterCount}
              </span>
            )}
          </div>
          
          {activeFilterCount > 0 && (
            <button
              onClick={onResetFilters}
              className="text-sm hover:opacity-80 font-medium flex items-center space-x-1"
              style={{ color: '#B370B0' }}
            >
              <X className="w-3 h-3" />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Sections */}
      <div className="divide-y divide-gray-200">
        {/* Recipe Poster Filter - Moved to top */}
        <FilterSection
          title="See Recipes From..."
          icon={<Users className="w-4 h-4" />}
          isOpen={openSections.recipePoster}
          onToggle={() => toggleSection('recipePoster')}
          badgeCount={filters.recipePoster !== 'everyone' ? 1 : 0}
        >
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="recipePoster"
                checked={filters.recipePoster === 'everyone'}
                onChange={() => updateFilters({ recipePoster: 'everyone' })}
                className="w-4 h-4 border-gray-300"
                style={{ accentColor: '#B370B0' }}
              />
              <span className="text-sm text-gray-700">Everyone</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="recipePoster"
                checked={filters.recipePoster === 'following'}
                onChange={() => updateFilters({ recipePoster: 'following' })}
                className="w-4 h-4 border-gray-300"
                style={{ accentColor: '#B370B0' }}
              />
              <span className="text-sm text-gray-700">People I Follow</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="recipePoster"
                checked={filters.recipePoster === 'my-own'}
                onChange={() => updateFilters({ recipePoster: 'my-own' })}
                className="w-4 h-4 border-gray-300"
                style={{ accentColor: '#B370B0' }}
              />
              <span className="text-sm text-gray-700">Only My Own</span>
            </label>
          </div>
        </FilterSection>

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

        {/* Excluded Ingredients Filter */}
        <FilterSection
          title="Exclude Ingredients"
          icon={<Shield className="w-4 h-4" />}
          isOpen={openSections.excludedIngredients}
          onToggle={() => toggleSection('excludedIngredients')}
          badgeCount={filters.excludedIngredients.length}
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Select ingredients to exclude from recipes. Great for allergies and dietary restrictions.
            </p>
            <MultiSelect
              options={filterOptions?.popularIngredients.map(ing => ({
                value: ing.name,
                label: ing.name,
                count: ing.count,
              })) || []}
              selectedValues={filters.excludedIngredients}
              onChange={(values) => updateFilters({ excludedIngredients: values })}
              placeholder="No ingredients available to exclude"
            />
          </div>
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

      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.difficulty.map(diff => (
              <span
                key={diff}
                className="inline-flex items-center space-x-1 text-white text-xs font-medium px-2 py-1 rounded-full"
                style={{ backgroundColor: '#B370B0' }}
              >
                <span className="capitalize">{diff}</span>
                <button
                  onClick={() => updateFilters({
                    difficulty: filters.difficulty.filter(d => d !== diff)
                  })}
                  className="hover:text-green-900 transition-colors"
                  aria-label={`Remove ${diff} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {filters.ingredients.map(ingredient => (
              <span
                key={ingredient}
                className="inline-flex items-center space-x-1 text-white text-xs font-medium px-2 py-1 rounded-full"
                style={{ backgroundColor: '#B370B0' }}
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
            
            {filters.excludedIngredients.map(ingredient => (
              <span
                key={`exclude-${ingredient}`}
                className="inline-flex items-center space-x-1 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full"
              >
                <Shield className="w-3 h-3" />
                <span>No {ingredient}</span>
                <button
                  onClick={() => updateFilters({
                    excludedIngredients: filters.excludedIngredients.filter(i => i !== ingredient)
                  })}
                  className="hover:text-red-900 transition-colors"
                  aria-label={`Remove ${ingredient} exclusion filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {filters.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center space-x-1 text-white text-xs font-medium px-2 py-1 rounded-full"
                style={{ backgroundColor: '#B370B0' }}
              >
                <span>{tag}</span>
                <button
                  onClick={() => updateFilters({
                    tags: filters.tags.filter(t => t !== tag)
                  })}
                  className="hover:text-green-900 transition-colors"
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
            
            {filters.recipePoster !== 'everyone' && (
              <span className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                <Users className="w-3 h-3" />
                <span>
                  {filters.recipePoster === 'following' ? 'People I Follow' : 'Only My Own'}
                </span>
                <button
                  onClick={() => updateFilters({ recipePoster: 'everyone' })}
                  className="hover:text-blue-900 transition-colors"
                  aria-label="Remove recipe poster filter"
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