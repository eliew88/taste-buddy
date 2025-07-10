/**
 * Database Helper Functions
 * 
 * Provides utilities for handling recipe data with PostgreSQL native arrays.
 * This module has been simplified to only support PostgreSQL native array types.
 */

/**
 * Prepares recipe data for database storage
 * Uses PostgreSQL native arrays for ingredients and tags
 * @param data Recipe data with ingredients and tags as arrays
 * @returns Recipe data formatted for PostgreSQL
 */
export function prepareRecipeForDB(data: {
  ingredients: string[];
  tags: string[];
  [key: string]: unknown;
}) {
  // With PostgreSQL, we can use native arrays directly
  return {
    ...data,
    ingredients: data.ingredients,
    tags: data.tags,
  };
}

/**
 * Transforms recipe data from database format to app format
 * Handles both structured ingredients and native array tags
 * @param recipe Recipe data from database
 * @returns Recipe data ready for the app
 */
export function transformRecipeFromDB(recipe: {
  ingredients: { id: string; amount: number | null; unit: string | null; ingredient: string; }[];
  tags: string[];
  [key: string]: unknown;
}) {
  // Transform structured ingredients back to the format expected by the app
  return {
    ...recipe,
    ingredients: recipe.ingredients, // Keep structured ingredients
    tags: recipe.tags, // Tags remain as native arrays
  };
}