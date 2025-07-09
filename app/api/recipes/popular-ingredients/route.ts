/**
 * Popular Ingredients API Route
 * 
 * Provides real-time popular ingredients data from the database
 * by analyzing ingredient usage across all recipes.
 * 
 * @file app/api/recipes/popular-ingredients/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET handler to fetch popular ingredients from database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Get all recipes with their ingredients
    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: true,
      },
    });
    
    // Count ingredient occurrences
    const ingredientCounts = new Map<string, number>();
    
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        // Normalize ingredient name (lowercase, trim)
        const normalizedIngredient = ingredient.ingredient.toLowerCase().trim();
        if (normalizedIngredient) {
          ingredientCounts.set(
            normalizedIngredient,
            (ingredientCounts.get(normalizedIngredient) || 0) + 1
          );
        }
      });
    });
    
    // Convert to array and sort by count (descending)
    const popularIngredients = Array.from(ingredientCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: popularIngredients,
    });
    
  } catch (error) {
    console.error('Popular ingredients error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch popular ingredients',
      },
      { status: 500 }
    );
  }
}