/**
 * Database Helper Functions
 * 
 * Provides utilities for handling data transformation between
 * SQLite (JSON strings) and PostgreSQL (native arrays) formats.
 */

/**
 * Detects if the current database is PostgreSQL
 * @returns {boolean} True if PostgreSQL, false if SQLite
 */
export function isPostgreSQL(): boolean {
  return process.env.DATABASE_URL?.includes('postgres') || false;
}

/**
 * Prepares recipe data for database storage
 * Handles both SQLite (JSON strings) and PostgreSQL (native arrays)
 * @param data Recipe data with ingredients and tags as arrays
 * @returns Recipe data formatted for the current database
 */
export function prepareRecipeForDB(data: {
  ingredients: string[];
  tags: string[];
  [key: string]: unknown;
}) {
  const useNativeArrays = isPostgreSQL();
  
  return {
    ...data,
    ingredients: useNativeArrays ? data.ingredients : JSON.stringify(data.ingredients),
    tags: useNativeArrays ? data.tags : JSON.stringify(data.tags),
  };
}

/**
 * Transforms recipe data from database format to app format
 * Handles both SQLite (JSON strings) and PostgreSQL (native arrays)
 * @param recipe Recipe data from database
 * @returns Recipe data with arrays properly formatted for the app
 */
export function transformRecipeFromDB(recipe: {
  ingredients: string | string[];
  tags: string | string[];
  [key: string]: unknown;
}) {
  return {
    ...recipe,
    ingredients: typeof recipe.ingredients === 'string' 
      ? JSON.parse(recipe.ingredients) 
      : recipe.ingredients,
    tags: typeof recipe.tags === 'string'
      ? JSON.parse(recipe.tags)
      : recipe.tags,
  };
}