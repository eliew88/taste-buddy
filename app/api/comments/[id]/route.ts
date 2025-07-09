/**
 * Individual Comment API Routes
 * 
 * Handles operations on specific comments.
 * 
 * PUT /api/comments/[id] - Update a comment (author only)
 * DELETE /api/comments/[id] - Delete a comment (author only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

/**
 * Validation schema for updating comments
 */
const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long').optional(),
  visibility: z.enum(['private', 'author_only', 'public']).optional(),
});

/**
 * PUT /api/comments/[id]
 * 
 * Updates a comment (only the author can update their own comments)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: commentId } = await params;
    const body = await request.json();
    const validatedData = updateCommentSchema.parse(body);

    // Check if comment exists and user is the author
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true }
    });

    if (!existingComment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (existingComment.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: validatedData,
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
      data: updatedComment
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/[id]
 * 
 * Deletes a comment (only the author can delete their own comments)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: commentId } = await params;

    // Check if comment exists and user is the author
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true }
    });

    if (!existingComment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (existingComment.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id: commentId }
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}