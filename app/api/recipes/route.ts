// app/api/recipes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { createNewRecipeNotification } from '@/lib/notification-utils';
import { evaluateRecipeAchievements, evaluatePhotoAchievements } from '@/lib/achievement-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const featured = searchParams.get('featured') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const skip = (page - 1) * limit;

    // Get current user ID to handle visibility
    const currentUserId = await getCurrentUserId();

    // Build where clause for PostgreSQL with case-insensitive search
    const where: Record<string, unknown> = {};

    // Visibility filter: only show public recipes for public feeds
    // Private recipes should not appear in public feeds, even for their authors
    where.isPublic = true;

    // Search functionality (PostgreSQL with case-insensitive search)
    if (search) {
      const searchLower = search.toLowerCase();
      const searchConditions = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        // Search in structured ingredients
        { ingredients: { some: { ingredient: { contains: search, mode: 'insensitive' } } } },
        { tags: { hasSome: [searchLower] } },
      ];

      // Combine search with visibility - only public recipes for public feeds
      where.AND = [
        { isPublic: true },
        {
          OR: searchConditions
        }
      ];
      delete where.isPublic; // Remove since it's now in AND
    }

    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      where.difficulty = difficulty;
    }

    // For featured recipes, only get recipes with images (in production only)
    if (featured && process.env.NODE_ENV === 'production') {
      where.images = {
        some: {}
      };
    }

    // Fetch recipes with rating aggregation
    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        ingredients: true,
        images: {
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { 
            // Count legacy favorites for backwards compatibility temporarily
            favorites: true, 
            ratings: true, 
            comments: true,
            // Count all Recipe Book entries across all categories
            recipeBookEntries: true
          },
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

      // Use Recipe Book favorites count instead of legacy favorites
      const recipeBookFavoritesCount = recipe._count.recipeBookEntries;
      const updatedCount = {
        ...recipe._count,
        favorites: recipeBookFavoritesCount // Replace legacy count with Recipe Book count
      };

      return {
        ...recipe,
        avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
        _count: updatedCount,
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
    console.log('=== RECIPE CREATION START ===');
    console.log('Timestamp:', new Date().toISOString());
    
    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    
    const { 
      title, 
      description, 
      ingredients, 
      instructions, 
      cookTime, 
      servings, 
      difficulty, 
      tags,
      images,
      isPublic
    } = body;
    
    console.log('Extracted fields:', {
      title: title?.slice(0, 50) + '...',
      hasDescription: !!description,
      ingredientsCount: Array.isArray(ingredients) ? ingredients.length : 'not array',
      hasInstructions: !!instructions,
      cookTime,
      servings,
      difficulty,
      tagsCount: Array.isArray(tags) ? tags.length : 'not array',
      imagesCount: Array.isArray(images) ? images.length : 'not array'
    });
    console.log('Full request body for debugging:', JSON.stringify(body, null, 2));

    // Validation
    console.log('Starting validation...');
    if (!title?.trim()) {
      console.log('Validation failed: No title');
      return NextResponse.json(
        { success: false, error: 'Recipe title is required' },
        { status: 400 }
      );
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      console.log('Validation failed: Invalid ingredients', { ingredients });
      return NextResponse.json(
        { success: false, error: 'At least one ingredient is required' },
        { status: 400 }
      );
    }

    // Validate ingredients structure
    console.log('Validating ingredients structure...');
    for (let i = 0; i < ingredients.length; i++) {
      const ingredient = ingredients[i];
      console.log(`Ingredient ${i}:`, ingredient);
      if (!ingredient.ingredient?.trim()) {
        console.log(`Validation failed: Invalid ingredient ${i}`, ingredient);
        return NextResponse.json(
          { success: false, error: 'Each ingredient must have an ingredient name' },
          { status: 400 }
        );
      }
    }

    if (!instructions?.trim()) {
      console.log('Validation failed: No instructions');
      return NextResponse.json(
        { success: false, error: 'Cooking instructions are required' },
        { status: 400 }
      );
    }
    console.log('All validation passed!');

    // Get authenticated user ID
    console.log('Getting user ID...');
    const userId = await getCurrentUserId();
    console.log('User ID:', userId);
    
    if (!userId) {
      console.log('Authentication failed: No user ID');
      return NextResponse.json(
        { success: false, error: 'Authentication required to create recipes' },
        { status: 401 }
      );
    }

    // Verify the user exists in the database
    console.log('Verifying user exists...');
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });
    console.log('User exists check:', !!userExists);
    
    if (!userExists) {
      console.log('User verification failed: User does not exist in database');
      return NextResponse.json(
        { success: false, error: 'Invalid user session. Please sign in again.' },
        { status: 401 }
      );
    }

    // Prepare data for PostgreSQL database storage with structured ingredients and images
    console.log('Preparing recipe data...');
    
    // Prepare images data if provided
    let imagesData = undefined;
    if (Array.isArray(images) && images.length > 0) {
      console.log('Processing images data...');
      imagesData = {
        create: images.map((img: any, index: number) => {
          const imageData = {
            url: img.url,
            filename: img.filename || null,
            caption: img.caption || null,
            alt: img.alt || null,
            width: img.width || null,
            height: img.height || null,
            fileSize: img.fileSize || null,
            displayOrder: img.displayOrder !== undefined ? img.displayOrder : index,
            isPrimary: img.isPrimary === true || (index === 0 && !images.some((i: any) => i.isPrimary === true))
          };
          console.log(`Mapped image ${index}:`, imageData);
          return imageData;
        })
      };
    }
    
    const recipeData = {
      title: title.trim(),
      description: description?.trim() || null,
      instructions: instructions.trim(),
      cookTime: cookTime?.trim() || null,
      servings: servings ? Math.max(1, parseInt(servings)) : null,
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'easy',
      tags: Array.isArray(tags) ? tags : [],
      isPublic: isPublic !== undefined ? Boolean(isPublic) : true, // Default to public for backward compatibility
      authorId: userId,
      ingredients: {
        create: ingredients.map((ingredient: any, index: number) => {
          const parsed = {
            amount: ingredient.amount !== undefined && ingredient.amount !== null && ingredient.amount !== '' 
              ? parseFloat(ingredient.amount) 
              : null,
            unit: ingredient.unit?.trim() || null,
            ingredient: ingredient.ingredient.trim(),
          };
          console.log(`Mapped ingredient ${index}:`, parsed);
          return parsed;
        })
      },
      ...(imagesData && { images: imagesData })
    };
    
    console.log('Recipe data prepared:', {
      title: recipeData.title,
      hasDescription: !!recipeData.description,
      ingredientsCount: recipeData.ingredients.create.length,
      hasInstructions: !!recipeData.instructions,
      authorId: recipeData.authorId,
      imagesCount: imagesData ? imagesData.create.length : 0
    });

    // Create recipe in database
    console.log('Creating recipe in database...');
    const recipe = await prisma.recipe.create({
      data: recipeData,
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        ingredients: true,
        images: {
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { 
            // Count legacy favorites for backwards compatibility temporarily
            favorites: true, 
            ratings: true, 
            comments: true,
            // Count all Recipe Book entries across all categories
            recipeBookEntries: true
          },
        },
      },
    });
    
    console.log('Recipe created successfully:', {
      id: recipe.id,
      title: recipe.title,
      ingredientsCount: recipe.ingredients.length,
      imagesCount: recipe.images?.length || 0,
      authorId: recipe.authorId
    });

    // Evaluate achievements for the recipe author
    let allNewAchievements: any[] = [];
    try {
      console.log('Evaluating achievements for recipe creation...');
      const achievementResults = [];
      
      // Check recipe count and ingredient achievements
      const recipeAchievements = await evaluateRecipeAchievements(recipe.authorId);
      achievementResults.push(recipeAchievements);
      
      // Check photo achievements if images were uploaded
      if (recipe.images && recipe.images.length > 0) {
        const photoAchievements = await evaluatePhotoAchievements(recipe.authorId);
        achievementResults.push(photoAchievements);
      }
      
      // Collect all new achievements
      achievementResults.forEach(result => {
        if (result.newAchievements.length > 0) {
          console.log(`User ${recipe.authorId} earned achievements:`, 
            result.newAchievements.map(a => a.achievement.name));
          allNewAchievements.push(...result.newAchievements);
        }
      });
      
    } catch (error) {
      console.error('Failed to evaluate achievements:', error);
      // Don't fail the recipe creation if achievement evaluation fails
    }

    // Notify followers about the new recipe
    try {
      console.log('Creating notifications for new recipe...');
      
      // Get the author's followers
      const followers = await prisma.follow.findMany({
        where: { followingId: recipe.authorId },
        select: { followerId: true }
      });
      
      if (followers.length > 0) {
        const followerIds = followers.map(f => f.followerId);
        const authorName = recipe.author.name || recipe.author.email;
        
        await createNewRecipeNotification(
          recipe.authorId,
          recipe.id,
          recipe.title,
          authorName,
          followerIds
        );
        
        console.log(`Created notifications for ${followerIds.length} followers`);
      }
    } catch (error) {
      console.error('Failed to create recipe notifications:', error);
      // Don't fail the recipe creation if notifications fail
    }

    // Recipe data is ready for response (no transformation needed with PostgreSQL)
    const transformedRecipe = {
      ...recipe,
      avgRating: 0, // New recipes start with 0 rating
    };

    console.log('Returning successful response');
    console.log('=== RECIPE CREATION SUCCESS ===');
    return NextResponse.json(
      { 
        success: true, 
        data: transformedRecipe,
        newAchievements: allNewAchievements // Include achievements in response
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('=== RECIPE CREATION ERROR ===');
    console.error('Error creating recipe:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      databaseProtocol: process.env.DATABASE_URL?.split('://')[0] || 'UNKNOWN'
    });
    console.error('=== END RECIPE CREATION ERROR ===');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create recipe',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}