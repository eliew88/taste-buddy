/**
 * Debug Recipes API Route
 * 
 * Simplified endpoint to test basic recipe fetching functionality
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    console.log('DEBUG: Starting basic recipe fetch test');
    
    // Test basic database connection
    const recipeCount = await prisma.recipe.count();
    console.log('DEBUG: Total recipes in database:', recipeCount);
    
    // Test fetching one recipe with full relations
    const sampleRecipe = await prisma.recipe.findFirst({
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        ingredients: true,
        _count: {
          select: { favorites: true, ratings: true, comments: true },
        },
        ratings: {
          select: { rating: true },
        },
      },
    });
    
    console.log('DEBUG: Sample recipe fetched:', !!sampleRecipe);
    if (sampleRecipe) {
      console.log('DEBUG: Sample recipe has ingredients:', sampleRecipe.ingredients.length);
      console.log('DEBUG: Sample recipe has ratings:', sampleRecipe.ratings.length);
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRecipes: recipeCount,
        hasRecipes: recipeCount > 0,
        sampleRecipe: sampleRecipe ? {
          id: sampleRecipe.id,
          title: sampleRecipe.title,
          ingredientCount: sampleRecipe.ingredients.length,
          ratingCount: sampleRecipe.ratings.length,
        } : null,
        timestamp: new Date().toISOString(),
      },
    });
    
  } catch (error) {
    console.error('DEBUG: Error in debug endpoint:', error);
    console.error('DEBUG: Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}