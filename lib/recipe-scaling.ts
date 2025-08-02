/**
 * Recipe Scaling Utilities
 * 
 * Utilities for scaling ingredient amounts in structured IngredientEntry format.
 * Handles proper formatting of scaled amounts with fractions and decimals.
 * 
 * @file lib/recipe-scaling.ts
 */

import { IngredientEntry } from '@/types/recipe';

/**
 * Parsed ingredient structure
 */
export interface ParsedIngredient {
  /** Original ingredient text */
  original: string;
  /** Parsed amount(s) - can be multiple for ranges */
  amounts: number[];
  /** The unit of measurement (e.g., "cups", "tsp", "oz") */
  unit: string;
  /** The ingredient name/description */
  ingredient: string;
  /** Whether parsing was successful */
  parseable: boolean;
}

/**
 * Convert common fractions to decimal numbers
 * Supports both ASCII fractions (1/2) and Unicode fractions (½)
 */
const fractionMap: Record<string, number> = {
  // ASCII fractions
  '1/8': 0.125,
  '1/4': 0.25,
  '1/3': 0.33,
  '1/2': 0.5,
  '2/3': 0.67,
  '3/4': 0.75,
  '1/6': 0.17,
  '1/16': 0.06,
  '3/8': 0.38,
  '5/8': 0.63,
  '7/8': 0.88,
  '1/5': 0.2,
  '2/5': 0.4,
  '3/5': 0.6,
  '4/5': 0.8,
  // Unicode fractions
  '½': 0.5,
  '⅓': 0.33,
  '⅔': 0.67,
  '¼': 0.25,
  '¾': 0.75,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 0.17,
  '⅐': 0.14,
  '⅛': 0.125,
  '⅑': 0.11,
  '⅒': 0.1,
  '⅜': 0.38,
  '⅝': 0.63,
  '⅞': 0.88,
  // Additional common cooking fractions
  '1/10': 0.1,
  '3/10': 0.3,
  '7/10': 0.7,
  '9/10': 0.9,
};

/**
 * Convert fraction string to decimal
 * Supports Unicode fractions, ASCII fractions, and mixed numbers
 */
export function parseFraction(fraction: string): number {
  // Remove any whitespace
  fraction = fraction.trim();
  
  // Check common fractions first (both Unicode and ASCII)
  if (fractionMap[fraction]) {
    return fractionMap[fraction];
  }
  
  // Handle other fractions like 5/6, 7/9, etc.
  const parts = fraction.split('/');
  if (parts.length === 2) {
    const numerator = parseInt(parts[0]);
    const denominator = parseInt(parts[1]);
    if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
      // Round to 2 decimal places to match other fractions
      return Math.round((numerator / denominator) * 100) / 100;
    }
  }
  
  return 0;
}

/**
 * Parse a number that might include fractions (e.g., "2 1/2", "1/4", "3.5", "¾")
 * Supports Unicode fractions, ASCII fractions, mixed numbers, and decimals
 */
export function parseNumber(text: string): number {
  // Remove extra whitespace
  text = text.trim();
  
  // Handle mixed numbers like "2 1/2" or "2¾"
  const mixedMatch = text.match(/^(\d+)\s*([\u00BC-\u00BE\u2150-\u215E]|\d+\/\d+)$/);
  if (mixedMatch) {
    const wholeNumber = parseInt(mixedMatch[1]);
    const fraction = parseFraction(mixedMatch[2]);
    return Math.round((wholeNumber + fraction) * 100) / 100;
  }
  
  // Handle pure fractions like "1/2" or Unicode fractions like "¾"
  if (text.includes('/') || /[\u00BC-\u00BE\u2150-\u215E]/.test(text)) {
    const result = parseFraction(text);
    return result > 0 ? result : 0;
  }
  
  // Handle decimal numbers
  const decimal = parseFloat(text);
  return isNaN(decimal) ? 0 : Math.round(decimal * 100) / 100;
}

/**
 * Parse ingredient text to extract amounts, units, and ingredient names
 */
export function parseIngredient(ingredientText: string): ParsedIngredient {
  const original = ingredientText.trim();
  
  // Common units pattern (case insensitive)
  const unitPattern = /\b(cup|cups|tsp|teaspoon|teaspoons|tbsp|tablespoon|tablespoons|oz|ounce|ounces|lb|pound|pounds|g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|qt|quart|quarts|pt|pint|pints|gal|gallon|gallons|fl oz|fluid ounce|fluid ounces|inch|inches|cm|centimeter|centimeters|clove|cloves|slice|slices|piece|pieces|large|medium|small|whole|pinch|pinches|dash|dashes|can|cans|package|packages|box|boxes)\b/i;
  
  // Try to match: [amount] [unit] [ingredient]
  // Supports ranges like "1-2 cups" or "1 to 2 cups"
  const patterns = [
    // Range patterns: "1-2 cups flour" or "1 to 2 cups flour"
    /^(\d+(?:\s+\d+\/\d+)?|\d+\/\d+|\d*\.?\d+)\s*(?:[-–—]|to)\s*(\d+(?:\s+\d+\/\d+)?|\d+\/\d+|\d*\.?\d+)\s+(.*?)$/i,
    // Single amount with unit: "2 cups flour" or "1/2 cup sugar"
    /^(\d+(?:\s+\d+\/\d+)?|\d+\/\d+|\d*\.?\d+)\s+(.*?)$/i,
  ];
  
  // Try range pattern first
  const rangeMatch = original.match(patterns[0]);
  if (rangeMatch) {
    const amount1 = parseNumber(rangeMatch[1]);
    const amount2 = parseNumber(rangeMatch[2]);
    const remainder = rangeMatch[3].trim();
    
    // Extract unit from remainder
    const unitMatch = remainder.match(unitPattern);
    const unit = unitMatch ? unitMatch[0] : '';
    const ingredient = remainder.replace(unitPattern, '').trim();
    
    if (amount1 > 0 && amount2 > 0) {
      return {
        original,
        amounts: [amount1, amount2],
        unit,
        ingredient,
        parseable: true,
      };
    }
  }
  
  // Try single amount pattern
  const singleMatch = original.match(patterns[1]);
  if (singleMatch) {
    const amount = parseNumber(singleMatch[1]);
    const remainder = singleMatch[2].trim();
    
    // Extract unit from remainder
    const unitMatch = remainder.match(unitPattern);
    const unit = unitMatch ? unitMatch[0] : '';
    const ingredient = remainder.replace(unitPattern, '').trim();
    
    if (amount > 0) {
      return {
        original,
        amounts: [amount],
        unit,
        ingredient,
        parseable: true,
      };
    }
  }
  
  // If we can't parse it, return as unparseable
  return {
    original,
    amounts: [],
    unit: '',
    ingredient: original,
    parseable: false,
  };
}

/**
 * Format a decimal number as a fraction when appropriate
 * Prefers Unicode fractions for common values
 */
export function formatAsFraction(num: number): string {
  // Round to 2 decimal places to avoid floating point precision issues
  num = Math.round(num * 100) / 100;
  
  // If it's a whole number, return as-is
  if (num % 1 === 0) {
    return num.toString();
  }
  
  // Check if it matches a common fraction (prefer Unicode for display)
  const unicodeFractions: Record<number, string> = {
    0.5: '½',
    0.33: '⅓',
    0.67: '⅔',
    0.25: '¼',
    0.75: '¾',
    0.2: '⅕',
    0.4: '⅖',
    0.6: '⅗',
    0.8: '⅘',
    0.17: '⅙',
    0.125: '⅛',
    0.38: '⅜',
    0.63: '⅝',
    0.88: '⅞',
  };
  
  if (unicodeFractions[num]) {
    return unicodeFractions[num];
  }
  
  // Check if it's a mixed number with a common fraction
  const wholeNumber = Math.floor(num);
  const fractionalPart = Math.round((num - wholeNumber) * 100) / 100;
  
  if (unicodeFractions[fractionalPart]) {
    return wholeNumber > 0 ? `${wholeNumber}${unicodeFractions[fractionalPart]}` : unicodeFractions[fractionalPart];
  }
  
  // If no common fraction matches, use decimal with appropriate precision
  if (num < 1) {
    return num.toFixed(2).replace(/\.?0+$/, '');
  } else {
    return num.toFixed(2).replace(/\.?0+$/, '');
  }
}

/**
 * Scale a parsed ingredient by a multiplier
 */
export function scaleIngredient(parsed: ParsedIngredient, multiplier: number): string {
  if (!parsed.parseable || parsed.amounts.length === 0) {
    // If we can't parse it, return the original
    return parsed.original;
  }
  
  if (parsed.amounts.length === 1) {
    // Single amount
    const scaledAmount = parsed.amounts[0] * multiplier;
    const formattedAmount = formatAsFraction(scaledAmount);
    
    // Reconstruct the ingredient string
    const parts = [formattedAmount];
    if (parsed.unit) parts.push(parsed.unit);
    if (parsed.ingredient) parts.push(parsed.ingredient);
    
    return parts.join(' ');
  } else {
    // Range (2 amounts)
    const scaledAmount1 = parsed.amounts[0] * multiplier;
    const scaledAmount2 = parsed.amounts[1] * multiplier;
    const formattedAmount1 = formatAsFraction(scaledAmount1);
    const formattedAmount2 = formatAsFraction(scaledAmount2);
    
    // Reconstruct the range string
    const parts = [`${formattedAmount1}-${formattedAmount2}`];
    if (parsed.unit) parts.push(parsed.unit);
    if (parsed.ingredient) parts.push(parsed.ingredient);
    
    return parts.join(' ');
  }
}

/**
 * Scale a single IngredientEntry by a multiplier
 */
export function scaleIngredientEntry(ingredient: IngredientEntry, multiplier: number): IngredientEntry {
  // Only scale if amount exists
  const scaledAmount = ingredient.amount !== undefined ? ingredient.amount * multiplier : undefined;
  
  return {
    ...ingredient,
    amount: scaledAmount,
  };
}

/**
 * Scale all ingredients in a recipe by a multiplier
 */
export function scaleIngredients(ingredients: IngredientEntry[], multiplier: number): IngredientEntry[] {
  if (!ingredients) return [];
  return ingredients.map(ingredient => scaleIngredientEntry(ingredient, multiplier));
}

/**
 * Get a display-friendly scale label
 */
export function getScaleLabel(scale: number): string {
  if (scale === 1) return '1x (Original)';
  if (scale < 1) return `${formatAsFraction(scale)}x`;
  if (scale % 1 === 0) return `${scale}x`;
  return `${scale.toFixed(1)}x`;
}