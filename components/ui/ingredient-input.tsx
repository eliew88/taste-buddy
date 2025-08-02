"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { CreateIngredientEntryData } from '@/types/recipe';
import { parseNumber } from '@/lib/recipe-scaling';

interface IngredientInputProps {
  ingredients: CreateIngredientEntryData[];
  onChange: (ingredients: CreateIngredientEntryData[]) => void;
  className?: string;
}

interface IngredientEntryState extends CreateIngredientEntryData {
  id: string;
  amountInput?: string; // Store raw input string while editing
}

const IngredientInput: React.FC<IngredientInputProps> = ({
  ingredients,
  onChange,
  className = ""
}) => {
  // Convert ingredients to internal state with temporary IDs
  const [entries, setEntries] = useState<IngredientEntryState[]>(() => 
    ingredients.map((ing, idx) => ({ 
      ...ing, 
      id: `temp-${idx}`,
      amountInput: ing.amount !== undefined && ing.amount !== null ? ing.amount.toString() : ''
    }))
  );

  // Refs for auto-focusing
  const amountRefs = useRef<(HTMLInputElement | null)[]>([]);
  const unitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const ingredientRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Update parent when entries change, excluding internal fields
    onChange(entries.map(({ id, amountInput, ...entry }) => entry));
  }, [entries]); // Remove onChange from dependencies to prevent infinite loop

  const addIngredient = (insertAtIndex?: number) => {
    const newEntry: IngredientEntryState = {
      id: `temp-${Date.now()}`,
      amount: undefined,
      unit: undefined,
      ingredient: '',
      amountInput: ''
    };
    
    if (insertAtIndex !== undefined) {
      // Insert at specific position
      const newEntries = [...entries];
      newEntries.splice(insertAtIndex + 1, 0, newEntry);
      setEntries(newEntries);
      
      // Focus the amount input of the new entry
      setTimeout(() => {
        amountRefs.current[insertAtIndex + 1]?.focus();
      }, 0);
    } else {
      // Add at the end (default behavior)
      setEntries([...entries, newEntry]);
      
      // Focus the amount input of the new entry
      setTimeout(() => {
        const lastIndex = entries.length;
        amountRefs.current[lastIndex]?.focus();
      }, 0);
    }
  };

  const removeIngredient = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const updateEntry = (id: string, field: keyof CreateIngredientEntryData | 'amountInput', value: string | number | undefined) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, [field]: field === 'unit' ? (value || undefined) : value } : entry
    ));
  };

  const updateEntryMultiple = (id: string, updates: Partial<IngredientEntryState>) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
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
    if (e.key === 'Tab') {
      e.preventDefault();
      // Tab moves to next ingredient or adds new one at the end
      if (index === entries.length - 1 && entries[index].ingredient.trim()) {
        addIngredient();
      } else if (index < entries.length - 1) {
        // Otherwise focus the next ingredient's amount
        amountRefs.current[index + 1]?.focus();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Enter always inserts a new ingredient at the current position
      if (entries[index].ingredient.trim()) {
        // Only insert if current ingredient has content
        addIngredient(index);
      }
    }
  };

  const handleAmountChange = (id: string, value: string) => {
    // Allow typing: numbers, decimals, fractions, Unicode fractions, spaces, and mixed numbers
    // More permissive regex that allows partial input while typing
    const allowedPattern = /^[\d\s\./\u00BC-\u00BE\u2150-\u215E]*$/;
    
    if (value === '' || allowedPattern.test(value)) {
      // Parse the value using our enhanced parseNumber function
      let numericValue: number | undefined;
      if (value === '') {
        numericValue = undefined;
      } else {
        const parsed = parseNumber(value);
        numericValue = parsed > 0 ? parsed : undefined;
      }
      
      updateEntryMultiple(id, {
        amountInput: value,
        amount: numericValue
      });
    }
  };

  const handleAmountBlur = (id: string, value: string) => {
    // On blur, ensure the final value is properly formatted
    if (value === '') {
      // Keep amount as undefined for empty values
      updateEntryMultiple(id, {
        amountInput: '',
        amount: undefined
      });
    } else {
      // Parse using our enhanced parseNumber function that handles fractions
      const numericValue = parseNumber(value);
      if (numericValue > 0) {
        // Keep the original input if it's a recognizable fraction format
        // This preserves user intent (e.g., they typed "3/4" so we keep "3/4")
        updateEntryMultiple(id, {
          amountInput: value,
          amount: numericValue
        });
      } else {
        // Invalid input, clear it
        updateEntryMultiple(id, {
          amountInput: '',
          amount: undefined
        });
      }
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
                inputMode="decimal"
                placeholder="1.5, ¾, 2½ (optional)"
                value={entry.amountInput || ''}
                onChange={(e) => handleAmountChange(entry.id, e.target.value)}
                onBlur={(e) => handleAmountBlur(entry.id, e.target.value)}
                onKeyDown={(e) => handleAmountKeyDown(e, index)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                title="Enter amount (optional - leave empty for ingredients like 'pinch of salt' or 'to taste')"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
        onClick={() => addIngredient()}
        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
      >
        <Plus size={16} />
        Add Ingredient
      </button>

      <div className="text-xs text-gray-500 mt-2">
        Tip: Amounts are optional - leave empty for ingredients like "pinch of salt" or "to taste". Use decimals (1.5), fractions (3/4), or Unicode fractions (¾, ½, ⅓). Press Tab to move to next ingredient or Space to move between amount/unit fields. Press Enter to insert a new ingredient at the current position.
      </div>
    </div>
  );
};

export default IngredientInput;