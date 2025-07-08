/**
 * SQLite-Compatible Search API Route
 * 
 * This version ensures case-insensitive search works properly with SQLite
 * by using alternative approaches that are guaranteed to work.
 * 
 * @file app/api/recipes/search/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { isPostgreSQL, transformRecipeFromDB } from '@/lib/db-helpers';

/**
 * Enhanced search parameters validation schema
 */
const enhancedSearchSchema = z.object({
  query: z.string().optional(),
  difficulty: z.array(z.enum(['easy', 'medium', 'hard'])).optional(),
  ingredients: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  cookTimeMin: z.number().min(0).optional(),
  cookTimeMax: z.number().min(0).optional(),
  servingsMin: z.number().min(1).optional(),
  servingsMax: z.number().min(1).optional(),
  minRating: z.number().min(0).max(5).optional(),
  authorId: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  sortBy: z.enum(['newest', 'oldest', 'popular', 'rating', 'title', 'cookTime', 'difficulty']).default('newest'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(12),
});

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
  
  // Match minutes (30m, 45 mins, etc.)
  const minutesMatch = timeStr.match(/(\d+)\s*m(?:ins?)?/);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1]);
  }
  
  // If no hours/minutes pattern, try to extract just numbers
  if (totalMinutes === 0) {
    const numberMatch = timeStr.match(/(\d+)/);
    if (numberMatch) {
      totalMinutes = parseInt(numberMatch[1]);
    }
  }
  
  return totalMinutes > 0 ? totalMinutes : null;
}

/**
 * Build search conditions for ingredients and tags based on database type
 */
function buildArraySearchConditions(field: 'ingredients' | 'tags', searchTerms: string[]) {
  const isPostgres = isPostgreSQL();
  
  if (isPostgres) {
    // PostgreSQL: Use array operations for native arrays
    return searchTerms.map(term => ({
      [field]: { hasSome: [term.toLowerCase()] }
    }));
  } else {
    // SQLite: Use string contains for JSON strings
    return searchTerms.map(term => ({
      [field]: { contains: term.toLowerCase() }
    }));
  }
}

/**
 * Build text search conditions based on database type
 */
function buildTextSearchConditions(query: string) {
  const isPostgres = isPostgreSQL();
  const searchQuery = query.toLowerCase();
  
  if (isPostgres) {
    // PostgreSQL: Use array operations for ingredients/tags, contains for text fields
    return [
      { title: { contains: query, mode: 'insensitive' as const } },
      { description: { contains: query, mode: 'insensitive' as const } },
      { ingredients: { hasSome: [searchQuery] } },
      { tags: { hasSome: [searchQuery] } },
    ];
  } else {
    // SQLite: Use contains for all fields (JSON strings for arrays)
    return [
      { title: { contains: query } },
      { description: { contains: query } },
      { ingredients: { contains: searchQuery } },
      { tags: { contains: searchQuery } },
    ];
  }
}

/**
 * Enhanced GET handler with SQLite-compatible case-insensitive search
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate search parameters
    const rawParams = {
      query: searchParams.get('search') || searchParams.get('query') || undefined,
      difficulty: searchParams.get('difficulty') ? [searchParams.get('difficulty')].filter(Boolean) : searchParams.getAll('difficulty').filter(Boolean),
      ingredients: searchParams.getAll('ingredients').filter(Boolean),
      tags: searchParams.getAll('tags').filter(Boolean),
      cookTimeMin: searchParams.get('cookTimeMin') ? parseInt(searchParams.get('cookTimeMin')!) : undefined,
      cookTimeMax: searchParams.get('cookTimeMax') ? parseInt(searchParams.get('cookTimeMax')!) : undefined,
      servingsMin: searchParams.get('servingsMin') ? parseInt(searchParams.get('servingsMin')!) : undefined,
      servingsMax: searchParams.get('servingsMax') ? parseInt(searchParams.get('servingsMax')!) : undefined,
      minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
      authorId: searchParams.get('authorId') || undefined,
      createdAfter: searchParams.get('createdAfter') || undefined,
      createdBefore: searchParams.get('createdBefore') || undefined,
      sortBy: searchParams.get('sortBy') || 'newest',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 12,
    };
    
    const validationResult = enhancedSearchSchema.safeParse(rawParams);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid search parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }
    
    const params = validationResult.data;
    const { page, limit, sortBy } = params;
    const skip = (page - 1) * limit;
    
    // For case-insensitive search in SQLite, we'll use raw SQL
    const whereClause: Prisma.RecipeWhereInput = {};
    const searchConditions: Record<string, unknown>[] = [];
    
    // Handle text search with database-specific approach
    if (params.query) {
      searchConditions.push({
        OR: buildTextSearchConditions(params.query),
      });
    }
    
    // Difficulty filter (multiple selection)
    if (params.difficulty && params.difficulty.length > 0) {
      searchConditions.push({
        difficulty: { in: params.difficulty },
      });
    }
    
    // Ingredients filter (must contain all specified ingredients)
    if (params.ingredients && params.ingredients.length > 0) {
      const ingredientConditions = buildArraySearchConditions('ingredients', params.ingredients);
      searchConditions.push(...ingredientConditions);
    }
    
    // Tags filter (must contain all specified tags)
    if (params.tags && params.tags.length > 0) {
      const tagConditions = buildArraySearchConditions('tags', params.tags);
      searchConditions.push(...tagConditions);
    }
    
    // Servings range filter
    if (params.servingsMin || params.servingsMax) {
      const servingsFilter: Record<string, unknown> = {};
      if (params.servingsMin) servingsFilter.gte = params.servingsMin;
      if (params.servingsMax) servingsFilter.lte = params.servingsMax;
      searchConditions.push({ servings: servingsFilter });
    }
    
    // Author filter
    if (params.authorId) {
      searchConditions.push({ authorId: params.authorId });
    }
    
    // Date range filter
    if (params.createdAfter || params.createdBefore) {
      const dateFilter: Record<string, unknown> = {};
      if (params.createdAfter) dateFilter.gte = new Date(params.createdAfter);
      if (params.createdBefore) dateFilter.lte = new Date(params.createdBefore);
      searchConditions.push({ createdAt: dateFilter });
    }
    
    // Apply all conditions
    if (searchConditions.length > 0) {
      whereClause.AND = searchConditions;
    }
    
    // Build order by clause
    let orderBy: Prisma.RecipeOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'title':
        orderBy = { title: 'asc' };
        break;
      case 'difficulty':
        orderBy = { difficulty: 'asc' };
        break;
      case 'popular':
        orderBy = { favorites: { _count: 'desc' } };
        break;
      case 'rating':
        orderBy = { ratings: { _count: 'desc' } };
        break;
      case 'cookTime':
        orderBy = { cookTime: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }
    
    // Execute search query
    const [recipes, totalCount] = await Promise.all([
      prisma.recipe.findMany({
        where: whereClause,
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { favorites: true, ratings: true },
          },
          ratings: {
            select: { rating: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.recipe.count({ where: whereClause }),
    ]);
    
    // Transform recipes and add computed fields
    const transformedRecipes = recipes.map(recipe => {
      const transformed = transformRecipeFromDB(recipe);
      
      // Calculate average rating from ratings array
      const totalRating = recipe.ratings.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = recipe.ratings.length > 0 ? totalRating / recipe.ratings.length : 0;
      
      return {
        ...transformed,
        cookTimeMinutes: parseCookTimeToMinutes(recipe.cookTime || undefined),
        avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
        // Remove ratings array from response for cleaner API
        ratings: undefined,
      };
    });
    
    // Apply post-query filters that require computed fields
    let filteredRecipes = transformedRecipes;
    
    // Cook time filter (applied after parsing)
    if (params.cookTimeMin || params.cookTimeMax) {
      filteredRecipes = filteredRecipes.filter(recipe => {
        const cookTimeMinutes = recipe.cookTimeMinutes;
        if (!cookTimeMinutes) return false;
        
        if (params.cookTimeMin && cookTimeMinutes < params.cookTimeMin) return false;
        if (params.cookTimeMax && cookTimeMinutes > params.cookTimeMax) return false;
        
        return true;
      });
    }
    
    // Rating filter (applied after calculation)
    if (params.minRating) {
      filteredRecipes = filteredRecipes.filter(recipe => 
        (recipe.avgRating || 0) >= params.minRating!
      );
    }
    
    // Calculate search metadata
    const endTime = Date.now();
    const searchTime = endTime - startTime;
    
    // Build applied filters summary
    const appliedFilters = [];
    if (params.query) appliedFilters.push(`Search: "${params.query}"`);
    if (params.difficulty?.length) appliedFilters.push(`Difficulty: ${params.difficulty.join(', ')}`);
    if (params.ingredients?.length) appliedFilters.push(`Ingredients: ${params.ingredients.join(', ')}`);
    if (params.tags?.length) appliedFilters.push(`Tags: ${params.tags.join(', ')}`);
    if (params.cookTimeMin || params.cookTimeMax) {
      appliedFilters.push(`Cook time: ${params.cookTimeMin || 0}-${params.cookTimeMax || '∞'} mins`);
    }
    if (params.servingsMin || params.servingsMax) {
      appliedFilters.push(`Servings: ${params.servingsMin || 1}-${params.servingsMax || '∞'}`);
    }
    if (params.minRating) appliedFilters.push(`Min rating: ${params.minRating} stars`);
    
    // Generate suggestions for empty results
    const suggestions = totalCount === 0 ? [
      'Try removing some filters',
      'Check your spelling',
      'Use more general search terms',
      'Browse popular recipes instead',
    ] : undefined;
    
    const response = {
      success: true,
      data: filteredRecipes,
      meta: {
        totalResults: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        resultsPerPage: limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
        searchTime,
        appliedFilters: {
          count: appliedFilters.length,
          summary: appliedFilters,
        },
        suggestions,
      },
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Enhanced search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
        meta: {
          searchTime: Date.now() - startTime,
        },
      },
      { status: 500 }
    );
  }
}