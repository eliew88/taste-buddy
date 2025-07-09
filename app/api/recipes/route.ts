// app/api/recipes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const featured = searchParams.get('featured') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const skip = (page - 1) * limit;

    // Build where clause for SQLite (no mode: 'insensitive' support)
    const where: Record<string, unknown> = {};

    // Search functionality (PostgreSQL with case-insensitive search)
    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        // PostgreSQL: Search in native arrays
        { ingredients: { hasSome: [searchLower] } },
        { tags: { hasSome: [searchLower] } },
      ];
    }

    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      where.difficulty = difficulty;
    }

    // For featured recipes, only get recipes with images
    if (featured) {
      where.image = { not: null };
    }

    // Fetch recipes with rating aggregation
    const recipes = await prisma.recipe.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Transform recipes for response (native PostgreSQL arrays need no transformation)
    const transformedRecipes = recipes.map(recipe => {
      // Calculate average rating from ratings array
      const totalRating = recipe.ratings.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = recipe.ratings.length > 0 ? totalRating / recipe.ratings.length : 0;

      return {
        ...recipe,
        avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
        // Remove ratings array from response for cleaner API
        ratings: undefined,
      };
    });

    const total = await prisma.recipe.count({ where });

    return NextResponse.json({
      success: true,
      data: transformedRecipes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      ingredients, 
      instructions, 
      cookTime, 
      servings, 
      difficulty, 
      tags,
      image 
    } = body;

    // Validation
    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Recipe title is required' },
        { status: 400 }
      );
    }

    if (!ingredients || (Array.isArray(ingredients) ? ingredients.length === 0 : !ingredients.trim())) {
      return NextResponse.json(
        { success: false, error: 'At least one ingredient is required' },
        { status: 400 }
      );
    }

    if (!instructions?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Cooking instructions are required' },
        { status: 400 }
      );
    }

    // Get authenticated user ID
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to create recipes' },
        { status: 401 }
      );
    }

    // Prepare data for PostgreSQL database storage (native arrays)
    const recipeData = {
      title: title.trim(),
      description: description?.trim() || null,
      ingredients: Array.isArray(ingredients) ? ingredients : [ingredients].filter(Boolean),
      instructions: instructions.trim(),
      cookTime: cookTime?.trim() || null,
      servings: servings ? Math.max(1, parseInt(servings)) : null,
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'easy',
      tags: Array.isArray(tags) ? tags : [],
      image: image?.trim() || null,
      authorId: userId,
    };

    // Create recipe in database
    const recipe = await prisma.recipe.create({
      data: recipeData,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { favorites: true, ratings: true },
        },
      },
    });

    // Recipe data is ready for response (no transformation needed with PostgreSQL)
    const transformedRecipe = {
      ...recipe,
      avgRating: 0, // New recipes start with 0 rating
    };

    return NextResponse.json(
      { success: true, data: transformedRecipe }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating recipe:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      databaseProtocol: process.env.DATABASE_URL?.split('://')[0] || 'UNKNOWN'
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create recipe',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}