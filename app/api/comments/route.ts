/**
 * Comments API Routes
 * 
 * Handles CRUD operations for recipe comments with visibility controls.
 * 
 * POST /api/comments - Create a new comment
 * GET /api/comments?recipeId=... - Get comments for a recipe (filtered by visibility)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

/**
 * Validation schema for creating comments
 */
const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
  recipeId: z.string().min(1, 'Recipe ID is required'),
  visibility: z.enum(['private', 'author_only', 'public']).default('public'),
});

/**
 * GET /api/comments?recipeId=...
 * 
 * Retrieves comments for a specific recipe, filtered by visibility rules:
 * - private: Only visible to the comment author
 * - author_only: Visible to comment author and recipe author
 * - public: Visible to everyone
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get('recipeId');

    if (!recipeId) {
      return NextResponse.json(
        { success: false, error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    // Get recipe to find the author
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { authorId: true }
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Build visibility filter based on user's permissions
    const visibilityFilter = [];
    
    // Everyone can see public comments
    visibilityFilter.push({ visibility: 'public' });
    
    if (session?.user?.id) {
      const userId = session.user.id;
      
      // User can see their own private comments
      visibilityFilter.push({
        AND: [
          { visibility: 'private' },
          { userId }
        ]
      });
      
      // User can see author_only comments if they're the comment author or recipe author
      visibilityFilter.push({
        AND: [
          { visibility: 'author_only' },
          {
            OR: [
              { userId }, // Comment author
              { recipe: { authorId: userId } } // Recipe author
            ]
          }
        ]
      });
    }

    // Fetch comments with user information
    const comments = await prisma.comment.findMany({
      where: {
        recipeId,
        OR: visibilityFilter
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: comments
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments
 * 
 * Creates a new comment on a recipe
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // Verify recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: validatedData.recipeId },
      select: { id: true, authorId: true }
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        visibility: validatedData.visibility,
        userId: session.user.id,
        recipeId: validatedData.recipeId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: comment
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}