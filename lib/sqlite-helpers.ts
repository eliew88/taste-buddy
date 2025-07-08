/**
 * SQLite Helper Functions for TasteBuddy
 * 
 * These functions help convert between JavaScript arrays and JSON strings
 * for SQLite compatibility since SQLite doesn't support native arrays.
 */

/**
 * Converts a JavaScript array to a JSON string for SQLite storage
 * @param array - Array of strings to convert
 * @returns JSON string representation
 */
export function arrayToJson(array: string[]): string {
  if (!Array.isArray(array)) {
    return '[]';
  }
  return JSON.stringify(array.filter(item => item && item.trim()));
}

/**
 * Converts a JSON string from SQLite back to a JavaScript array
 * @param jsonString - JSON string from database
 * @returns Array of strings
 */
export function jsonToArray(jsonString: string | null): string[] {
  if (!jsonString) return [];
  
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed.filter(item => item && typeof item === 'string') : [];
  } catch (error) {
    console.warn('Failed to parse JSON array:', jsonString, error);
    return [];
  }
}

/**
 * Safely parses ingredients from database format
 * @param ingredients - Raw ingredients from database (JSON string)
 * @returns Array of ingredient strings
 */
export function parseIngredients(ingredients: string | null): string[] {
  return jsonToArray(ingredients);
}

/**
 * Safely parses tags from database format
 * @param tags - Raw tags from database (JSON string)
 * @returns Array of tag strings
 */
export function parseTags(tags: string | null): string[] {
  return jsonToArray(tags);
}

/**
 * Prepares recipe data for database insertion/update
 * @param recipeData - Raw recipe data with array fields
 * @returns Recipe data with JSON string fields for SQLite
 */
export function prepareRecipeForDB(recipeData: {
  ingredients: string[] | string;
  tags: string[] | string;
  [key: string]: unknown;
}) {
  const ingredients = Array.isArray(recipeData.ingredients) 
    ? recipeData.ingredients 
    : recipeData.ingredients.split('\n').filter(i => i.trim());
    
  const tags = Array.isArray(recipeData.tags)
    ? recipeData.tags
    : recipeData.tags.split(',').map(t => t.trim()).filter(t => t);

  return {
    ...recipeData,
    ingredients: arrayToJson(ingredients),
    tags: arrayToJson(tags),
  };
}

/**
 * Transforms recipe from database format to application format
 * @param dbRecipe - Recipe from database with JSON string fields
 * @returns Recipe with JavaScript array fields
 */
export function transformRecipeFromDB(dbRecipe: {
  ingredients: string;
  tags: string;
  [key: string]: unknown;
}) {
  return {
    ...dbRecipe,
    ingredients: parseIngredients(dbRecipe.ingredients),
    tags: parseTags(dbRecipe.tags),
  };
}

