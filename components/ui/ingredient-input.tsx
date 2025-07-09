"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { CreateIngredientEntryData } from '@/types/recipe';

interface IngredientInputProps {
  ingredients: CreateIngredientEntryData[];
  onChange: (ingredients: CreateIngredientEntryData[]) => void;
  className?: string;
}

interface IngredientEntryState extends CreateIngredientEntryData {
  id: string;
}

const IngredientInput: React.FC<IngredientInputProps> = ({
  ingredients,
  onChange,
  className = ""
}) => {
  // Convert ingredients to internal state with temporary IDs
  const [entries, setEntries] = useState<IngredientEntryState[]>(() => 
    ingredients.map((ing, idx) => ({ ...ing, id: `temp-${idx}` }))
  );

  // Refs for auto-focusing
  const amountRefs = useRef<(HTMLInputElement | null)[]>([]);
  const unitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const ingredientRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Update parent when entries change
    onChange(entries.map(({ id, ...entry }) => entry));
  }, [entries]); // Remove onChange from dependencies to prevent infinite loop

  const addIngredient = () => {
    const newEntry: IngredientEntryState = {
      id: `temp-${Date.now()}`,
      amount: 0,
      unit: undefined,
      ingredient: ''
    };
    setEntries([...entries, newEntry]);
    
    // Focus the amount input of the new entry
    setTimeout(() => {
      const lastIndex = entries.length;
      amountRefs.current[lastIndex]?.focus();
    }, 0);
  };

  const removeIngredient = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const updateEntry = (id: string, field: keyof CreateIngredientEntryData, value: string | number | undefined) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, [field]: field === 'unit' ? (value || undefined) : value } : entry
    ));
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      unitRefs.current[index]?.focus();
    }
  };

  const handleUnitKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      ingredientRefs.current[index]?.focus();
    }
  };

  const handleIngredientKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // If this is the last ingredient and it's not empty, add a new one
      if (index === entries.length - 1 && entries[index].ingredient.trim()) {
        addIngredient();
      } else if (index < entries.length - 1) {
        // Otherwise focus the next ingredient's amount
        amountRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleAmountChange = (id: string, value: string) => {
    // Allow empty string or valid numbers (including decimals)
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      updateEntry(id, 'amount', value === '' ? 0 : parseFloat(value) || 0);
    }
  };

  // Common units for suggestions
  const commonUnits = [
    'cups', 'cup', 'tsp', 'tbsp', 'oz', 'lb', 'lbs', 'g', 'kg', 
    'ml', 'l', 'pieces', 'cloves', 'slices', 'cans', 'packages'
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        Ingredients
      </label>
      
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div key={entry.id} className="flex gap-2 items-center">
            {/* Amount Input */}
            <div className="w-20">
              <input
                ref={el => { amountRefs.current[index] = el; }}
                type="text"
                placeholder="2"
                value={entry.amount || ''}
                onChange={(e) => handleAmountChange(entry.id, e.target.value)}
                onKeyDown={(e) => handleAmountKeyDown(e, index)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Unit Input */}
            <div className="w-24">
              <input
                ref={el => { unitRefs.current[index] = el; }}
                type="text"
                placeholder="cups (optional)"
                value={entry.unit || ''}
                onChange={(e) => updateEntry(entry.id, 'unit', e.target.value || undefined)}
                onKeyDown={(e) => handleUnitKeyDown(e, index)}
                list={`units-${entry.id}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <datalist id={`units-${entry.id}`}>
                {commonUnits.map(unit => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
            </div>

            {/* Ingredient Input */}
            <div className="flex-1">
              <input
                ref={el => { ingredientRefs.current[index] = el; }}
                type="text"
                placeholder="flour"
                value={entry.ingredient}
                onChange={(e) => updateEntry(entry.id, 'ingredient', e.target.value)}
                onKeyDown={(e) => handleIngredientKeyDown(e, index)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => removeIngredient(entry.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              disabled={entries.length === 1}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Ingredient Button */}
      <button
        type="button"
        onClick={addIngredient}
        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
      >
        <Plus size={16} />
        Add Ingredient
      </button>

      <div className="text-xs text-gray-500 mt-2">
        Tip: Press Tab, Enter, or Space to move between fields. Filling out the last ingredient will automatically add a new one.
      </div>
    </div>
  );
};

export default IngredientInput;