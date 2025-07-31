/**
 * Filter Options API Route
 * 
 * Provides real-time filter options data from the database
 * for advanced search filters including popular ingredients,
 * tags, and statistics.
 * 
 * @file app/api/recipes/filter-options/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Utility function to parse cook time strings to minutes
 */
function parseCookTimeToMinutes(cookTime?: string): number | null {
  if (!cookTime) return null;
  
  const timeStr = cookTime.toLowerCase();
  let totalMinutes = 0;
  
  // Match hours (1h, 2 hours, etc.)
  const hoursMatch = timeStr.match(/(\d+)\s*h(?:ours?)?/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60;
  }
  
  // Match minutes (30m, 45 minutes, etc.)
  const minutesMatch = timeStr.match(/(\d+)\s*m(?:inutes?)?/);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1]);
  }
  
  // If no specific pattern found, assume it's just a number (minutes)
  if (totalMinutes === 0) {
    const numberMatch = timeStr.match(/(\d+)/);
    if (numberMatch) {
      totalMinutes = parseInt(numberMatch[1]);
    }
  }
  
  return totalMinutes > 0 ? totalMinutes : null;
}

/**
 * GET handler to fetch filter options from database
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const ingredientLimit = parseInt(searchParams.get('ingredientLimit') || '20');
    const tagLimit = parseInt(searchParams.get('tagLimit') || '15');
    
    // Build privacy filter for recipes - only public recipes for public feeds
    // Private recipes should not influence filter options, even for their authors
    const whereClause = {
      isPublic: true
    };
    
    // Get recipes with their data, filtered by visibility
    const recipes = await prisma.recipe.findMany({
      where: whereClause,
      include: {
        ingredients: true,
        _count: {
          select: { favorites: true, ratings: true },
        },
      },
    });
    
    // Initialize counters
    const ingredientCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();
    const difficultyCounts = new Map<string, number>();
    const cookTimes: number[] = [];
    const servings: number[] = [];
    
    // Process each recipe
    recipes.forEach(recipe => {
      // Count ingredients
      recipe.ingredients.forEach(ingredient => {
        const normalizedIngredient = ingredient.ingredient.toLowerCase().trim();
        if (normalizedIngredient) {
          ingredientCounts.set(
            normalizedIngredient,
            (ingredientCounts.get(normalizedIngredient) || 0) + 1
          );
        }
      });
      
      // Count tags
      recipe.tags.forEach(tag => {
        const normalizedTag = tag.toLowerCase().trim();
        if (normalizedTag) {
          tagCounts.set(
            normalizedTag,
            (tagCounts.get(normalizedTag) || 0) + 1
          );
        }
      });
      
      // Count difficulties
      if (recipe.difficulty) {
        difficultyCounts.set(
          recipe.difficulty,
          (difficultyCounts.get(recipe.difficulty) || 0) + 1
        );
      }
      
      // Collect cook times
      if (recipe.cookTime) {
        const cookTimeMinutes = parseCookTimeToMinutes(recipe.cookTime);
        if (cookTimeMinutes !== null) {
          cookTimes.push(cookTimeMinutes);
        }
      }
      
      // Collect servings
      if (recipe.servings) {
        servings.push(recipe.servings);
      }
    });
    
    // Process popular ingredients
    const popularIngredients = Array.from(ingredientCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, ingredientLimit);
    
    // Process popular tags
    const popularTags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, tagLimit);
    
    // Process difficulties
    const difficulties = Array.from(difficultyCounts.entries())
      .map(([value, count]) => ({ 
        value, 
        label: value.charAt(0).toUpperCase() + value.slice(1), 
        count 
      }))
      .sort((a, b) => {
        // Sort by difficulty order: easy, medium, hard
        const order = ['easy', 'medium', 'hard'];
        return order.indexOf(a.value) - order.indexOf(b.value);
      });
    
    // Calculate cook time statistics
    const cookTimeStats = cookTimes.length > 0 ? {
      min: Math.min(...cookTimes),
      max: Math.max(...cookTimes),
      average: Math.round(cookTimes.reduce((sum, time) => sum + time, 0) / cookTimes.length),
    } : {
      min: 5,
      max: 300,
      average: 45,
    };
    
    // Calculate servings statistics
    const servingsStats = servings.length > 0 ? {
      min: Math.min(...servings),
      max: Math.max(...servings),
      average: Math.round(servings.reduce((sum, serving) => sum + serving, 0) / servings.length),
    } : {
      min: 1,
      max: 12,
      average: 4,
    };
    
    return NextResponse.json({
      success: true,
      data: {
        difficulties,
        popularIngredients,
        tags: popularTags,
        cookTimeStats,
        servingsStats,
      },
    });
    
  } catch (error) {
    console.error('Filter options error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch filter options',
      },
      { status: 500 }
    );
  }
}