// app/api/recipes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const skip = (page - 1) * limit;

    // Build where clause for SQLite (no mode: 'insensitive' support)
    const where: any = {};

    // Search functionality (SQLite compatible - case insensitive search)
    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        { title: { contains: searchLower } },
        { description: { contains: searchLower } },
        // SQLite: Search in JSON fields using contains
        { ingredients: { contains: searchLower } },
        { tags: { contains: searchLower } },
      ];
    }

    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      where.difficulty = difficulty;
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

    // Transform recipes from DB format to app format
    const transformedRecipes = recipes.map(recipe => {
      // Parse JSON fields stored as strings in SQLite
      const ingredients = typeof recipe.ingredients === 'string' 
        ? JSON.parse(recipe.ingredients) 
        : recipe.ingredients;
      
      const tags = typeof recipe.tags === 'string' 
        ? JSON.parse(recipe.tags) 
        : recipe.tags;

      // Calculate average rating from ratings array
      const totalRating = recipe.ratings.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = recipe.ratings.length > 0 ? totalRating / recipe.ratings.length : 0;

      return {
        ...recipe,
        ingredients,
        tags,
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
      tags 
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

    // Prepare data for SQLite storage (convert arrays to JSON strings)
    const recipeData = {
      title: title.trim(),
      description: description?.trim() || null,
      ingredients: JSON.stringify(ingredients), // Store as JSON string for SQLite
      instructions: instructions.trim(),
      cookTime: cookTime?.trim() || null,
      servings: servings ? Math.max(1, parseInt(servings)) : null,
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'easy',
      tags: JSON.stringify(tags || []), // Store as JSON string for SQLite
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

    // Transform back to app format (parse JSON strings back to arrays)
    const transformedRecipe = {
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients),
      tags: JSON.parse(recipe.tags),
      avgRating: 0, // New recipes start with 0 rating
    };

    return NextResponse.json(
      { success: true, data: transformedRecipe }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create recipe' },
      { status: 500 }
    );
  }
}