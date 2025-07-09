/**
 * Recipe Scale Slider Component
 * 
 * Interactive slider component that allows users to scale recipe
 * ingredients from 0.25x to 10x the original amounts.
 * 
 * @file components/ui/recipe-scale-slider.tsx
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { getScaleLabel } from '@/lib/recipe-scaling';

interface RecipeScaleSliderProps {
  /** Current scale value */
  scale: number;
  /** Callback when scale changes */
  onScaleChange: (scale: number) => void;
  /** Minimum scale value (default: 0.25) */
  minScale?: number;
  /** Maximum scale value (default: 10) */
  maxScale?: number;
  /** Whether to show the exact numerical value */
  showNumericValue?: boolean;
}

/**
 * Common scale presets for quick selection
 */
const SCALE_PRESETS = [0.25, 0.5, 1, 1.5, 2, 3, 4, 5, 8, 10];

export default function RecipeScaleSlider({
  scale,
  onScaleChange,
  minScale = 0.25,
  maxScale = 10,
  showNumericValue = true,
}: RecipeScaleSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  // Convert scale to slider position (0-100)
  const scaleToPosition = useCallback((scaleValue: number) => {
    // Use logarithmic scale for better UX (more precision at lower values)
    const logMin = Math.log(minScale);
    const logMax = Math.log(maxScale);
    const logValue = Math.log(scaleValue);
    return ((logValue - logMin) / (logMax - logMin)) * 100;
  }, [minScale, maxScale]);
  
  // Convert slider position (0-100) to scale value
  const positionToScale = useCallback((position: number) => {
    const logMin = Math.log(minScale);
    const logMax = Math.log(maxScale);
    const logValue = logMin + (position / 100) * (logMax - logMin);
    return Math.exp(logValue);
  }, [minScale, maxScale]);
  
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const position = parseFloat(event.target.value);
    const newScale = positionToScale(position);
    // Round to reasonable precision
    const roundedScale = Math.round(newScale * 100) / 100;
    onScaleChange(Math.max(minScale, Math.min(maxScale, roundedScale)));
  };
  
  const handlePresetClick = (presetScale: number) => {
    onScaleChange(presetScale);
  };
  
  const handleReset = () => {
    onScaleChange(1);
  };
  
  const handleDecrease = () => {
    const newScale = Math.max(minScale, scale - 0.25);
    onScaleChange(newScale);
  };
  
  const handleIncrease = () => {
    const newScale = Math.min(maxScale, scale + 0.25);
    onScaleChange(newScale);
  };
  
  const currentPosition = scaleToPosition(scale);
  
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Scale Recipe</h3>
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            title="Reset to original scale"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
        
        {/* Current Scale Display */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-700">
            {getScaleLabel(scale)}
          </div>
          {showNumericValue && scale !== 1 && (
            <div className="text-sm text-gray-600">
              {scale > 1 ? 'More servings' : 'Fewer servings'}
            </div>
          )}
        </div>
        
        {/* Slider Controls */}
        <div className="flex items-center space-x-3">
          {/* Decrease Button */}
          <button
            onClick={handleDecrease}
            disabled={scale <= minScale}
            className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Decrease scale"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          {/* Main Slider */}
          <div className="flex-1 relative">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={currentPosition}
              onChange={handleSliderChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #16a34a 0%, #16a34a ${currentPosition}%, #e5e7eb ${currentPosition}%, #e5e7eb 100%)`
              }}
            />
            
            {/* Scale markers */}
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>¼x</span>
              <span>½x</span>
              <span>1x</span>
              <span>2x</span>
              <span>5x</span>
              <span>10x</span>
            </div>
          </div>
          
          {/* Increase Button */}
          <button
            onClick={handleIncrease}
            disabled={scale >= maxScale}
            className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Increase scale"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {/* Quick Preset Buttons */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Quick Scale:</div>
          <div className="flex flex-wrap gap-2">
            {SCALE_PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  Math.abs(scale - preset) < 0.01
                    ? 'bg-green-700 text-white border-green-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {getScaleLabel(preset)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Helpful Info */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="mb-1">
            <strong>Tip:</strong> Scaling adjusts ingredient amounts while keeping the recipe proportions.
          </p>
          <p>
            Perfect for cooking for more people or making smaller portions!
          </p>
        </div>
      </div>
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #16a34a;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #16a34a;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}