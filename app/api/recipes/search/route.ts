/**
 * PostgreSQL Search API Route
 * 
 * Provides advanced search functionality for recipes using PostgreSQL
 * native array operations and full-text search capabilities.
 * 
 * @file app/api/recipes/search/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { transformRecipeFromDB } from '@/lib/db-helpers';

/**
 * Enhanced search parameters validation schema
 */
const enhancedSearchSchema = z.object({
  query: z.string().optional(),
  difficulty: z.array(z.enum(['easy', 'medium', 'hard'])).optional(),
  ingredients: z.array(z.string()).optional(),
  excludedIngredients: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  cookTimeMin: z.number().min(0).optional(),
  cookTimeMax: z.number().min(0).optional(),
  servingsMin: z.number().min(1).optional(),
  servingsMax: z.number().min(1).optional(),
  minRating: z.number().min(0).max(5).optional(),
  authorId: z.string().optional(),
  tastebuddiesOnly: z.boolean().optional(),
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
 * Enhanced GET handler with PostgreSQL native array operations
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    // Parse and validate search parameters
    const rawParams = {
      query: searchParams.get('search') || searchParams.get('query') || undefined,
      difficulty: searchParams.get('difficulty') ? [searchParams.get('difficulty')].filter(Boolean) : searchParams.getAll('difficulty').filter(Boolean),
      ingredients: searchParams.getAll('ingredients').filter(Boolean),
      excludedIngredients: searchParams.getAll('excludedIngredients').filter(Boolean),
      tags: searchParams.getAll('tags').filter(Boolean),
      cookTimeMin: searchParams.get('cookTimeMin') ? parseInt(searchParams.get('cookTimeMin')!) : undefined,
      cookTimeMax: searchParams.get('cookTimeMax') ? parseInt(searchParams.get('cookTimeMax')!) : undefined,
      servingsMin: searchParams.get('servingsMin') ? parseInt(searchParams.get('servingsMin')!) : undefined,
      servingsMax: searchParams.get('servingsMax') ? parseInt(searchParams.get('servingsMax')!) : undefined,
      minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
      authorId: searchParams.get('authorId') || undefined,
      tastebuddiesOnly: searchParams.get('tastebuddiesOnly') === 'true',
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
    
    // Build where clause for PostgreSQL
    const where: Prisma.RecipeWhereInput = {
      AND: [],
    };
    
    const andConditions = where.AND as Prisma.RecipeWhereInput[];
    
    // Text search - PostgreSQL with case-insensitive search
    if (params.query && params.query.trim()) {
      const searchQuery = params.query.toLowerCase();
      andConditions.push({
        OR: [
          { title: { contains: params.query, mode: 'insensitive' } },
          { description: { contains: params.query, mode: 'insensitive' } },
          { ingredients: { some: { ingredient: { contains: searchQuery, mode: 'insensitive' } } } },
          { tags: { hasSome: [searchQuery] } },
        ],
      });
    }
    
    // Difficulty filter
    if (params.difficulty && params.difficulty.length > 0) {
      andConditions.push({
        difficulty: { in: params.difficulty },
      });
    }
    
    // Ingredients filter - PostgreSQL array operations
    if (params.ingredients && params.ingredients.length > 0) {
      andConditions.push({
        OR: params.ingredients.map(ing => ({
          ingredients: { 
            some: { 
              ingredient: { 
                contains: ing,
                mode: 'insensitive'
              } 
            } 
          }
        }))
      });
    }
    
    // Excluded ingredients filter - PostgreSQL array operations
    if (params.excludedIngredients && params.excludedIngredients.length > 0) {
      // For each excluded ingredient, ensure the recipe does NOT contain it
      params.excludedIngredients.forEach(excludedIng => {
        andConditions.push({
          NOT: {
            ingredients: {
              some: {
                ingredient: {
                  contains: excludedIng,
                  mode: 'insensitive'
                }
              }
            }
          }
        });
      });
    }
    
    // Tags filter - PostgreSQL array operations
    if (params.tags && params.tags.length > 0) {
      andConditions.push({
        tags: { hasSome: params.tags },
      });
    }
    
    // Cook time filter
    if (params.cookTimeMin !== undefined || params.cookTimeMax !== undefined) {
      const cookTimeConditions: Prisma.RecipeWhereInput[] = [];
      
      if (params.cookTimeMin !== undefined) {
        cookTimeConditions.push({
          cookTime: { not: null },
        });
      }
      
      if (cookTimeConditions.length > 0) {
        andConditions.push({ AND: cookTimeConditions });
      }
    }
    
    // Servings filter
    if (params.servingsMin !== undefined || params.servingsMax !== undefined) {
      const servingsConditions: Prisma.IntFilter = {};
      
      if (params.servingsMin !== undefined) {
        servingsConditions.gte = params.servingsMin;
      }
      
      if (params.servingsMax !== undefined) {
        servingsConditions.lte = params.servingsMax;
      }
      
      andConditions.push({
        servings: servingsConditions,
      });
    }
    
    // Author filter
    if (params.authorId) {
      andConditions.push({
        authorId: params.authorId,
      });
    }
    
    // TasteBuddies filter - only show recipes from users that the current user follows
    if (params.tastebuddiesOnly && session?.user?.id) {
      andConditions.push({
        author: {
          followers: {
            some: {
              followerId: session.user.id,
            },
          },
        },
      });
    }
    
    // Date range filter
    if (params.createdAfter || params.createdBefore) {
      const dateConditions: Prisma.DateTimeFilter = {};
      
      if (params.createdAfter) {
        dateConditions.gte = new Date(params.createdAfter);
      }
      
      if (params.createdBefore) {
        dateConditions.lte = new Date(params.createdBefore);
      }
      
      andConditions.push({
        createdAt: dateConditions,
      });
    }
    
    // Build orderBy clause
    const orderBy: Prisma.RecipeOrderByWithRelationInput = {};
    
    switch (params.sortBy) {
      case 'newest':
        orderBy.createdAt = 'desc';
        break;
      case 'oldest':
        orderBy.createdAt = 'asc';
        break;
      case 'popular':
        orderBy.favorites = { _count: 'desc' };
        break;
      case 'rating':
        orderBy.ratings = { _count: 'desc' };
        break;
      case 'title':
        orderBy.title = 'asc';
        break;
      case 'cookTime':
        orderBy.cookTime = 'asc';
        break;
      case 'difficulty':
        orderBy.difficulty = 'asc';
        break;
      default:
        orderBy.createdAt = 'desc';
    }
    
    // Calculate pagination
    const skip = (params.page - 1) * params.limit;
    
    // Execute search query
    const [recipes, totalCount] = await Promise.all([
      prisma.recipe.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true },
          },
          ingredients: true,
          _count: {
            select: { favorites: true, ratings: true, comments: true },
          },
          ratings: {
            select: { rating: true },
          },
        },
        orderBy,
        skip,
        take: params.limit,
      }),
      prisma.recipe.count({ where }),
    ]);
    
    // Transform recipes using helper function
    const transformedRecipes = recipes.map(recipe => {
      const transformed = transformRecipeFromDB(recipe);
      
      // Calculate average rating
      const totalRating = recipe.ratings.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = recipe.ratings.length > 0 ? totalRating / recipe.ratings.length : 0;
      
      return {
        ...transformed,
        avgRating: Math.round(avgRating * 10) / 10,
        // Remove ratings array from response
        ratings: undefined,
      };
    });
    
    // Calculate metadata
    const totalPages = Math.ceil(totalCount / params.limit);
    const hasNextPage = params.page < totalPages;
    const hasPrevPage = params.page > 1;
    
    return NextResponse.json({
      success: true,
      data: transformedRecipes,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount,
        totalPages: totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
      },
      { status: 500 }
    );
  }
}