/**
 * Individual Compliment API Routes
 * 
 * Handles operations on specific compliments.
 * 
 * PUT /api/compliments/[id] - Update a compliment (sender only, limited fields)
 * DELETE /api/compliments/[id] - Delete a compliment (sender only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

/**
 * Validation schema for updating compliments
 */
const updateComplimentSchema = z.object({
  message: z.string().min(1, 'Compliment message is required').max(500, 'Message too long').optional(),
});

/**
 * PUT /api/compliments/[id]
 * 
 * Updates a compliment (only the sender can update their own compliments, and only the message)
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

    const { id: complimentId } = await params;
    const body = await request.json();
    const validatedData = updateComplimentSchema.parse(body);

    // Check if compliment exists and user is the sender
    const existingCompliment = await prisma.compliment.findUnique({
      where: { id: complimentId },
      select: { fromUserId: true, type: true, paymentStatus: true }
    });

    if (!existingCompliment) {
      return NextResponse.json(
        { success: false, error: 'Compliment not found' },
        { status: 404 }
      );
    }

    if (existingCompliment.fromUserId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only edit your own compliments' },
        { status: 403 }
      );
    }

    // Don't allow editing tips that have been processed
    if (existingCompliment.type === 'tip' && existingCompliment.paymentStatus === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Cannot edit processed tip compliments' },
        { status: 400 }
      );
    }

    // Update the compliment
    const updatedCompliment = await prisma.compliment.update({
      where: { id: complimentId },
      data: validatedData,
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        toUser: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        recipe: {
          select: {
            id: true,
            title: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedCompliment
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating compliment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update compliment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/compliments/[id]
 * 
 * Deletes a compliment (only the sender can delete their own compliments)
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

    const { id: complimentId } = await params;

    // Check if compliment exists and user is the sender
    const existingCompliment = await prisma.compliment.findUnique({
      where: { id: complimentId },
      select: { fromUserId: true, type: true, paymentStatus: true }
    });

    if (!existingCompliment) {
      return NextResponse.json(
        { success: false, error: 'Compliment not found' },
        { status: 404 }
      );
    }

    if (existingCompliment.fromUserId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own compliments' },
        { status: 403 }
      );
    }

    // Don't allow deleting tips that have been processed
    if (existingCompliment.type === 'tip' && existingCompliment.paymentStatus === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete processed tip compliments' },
        { status: 400 }
      );
    }

    // Delete the compliment
    await prisma.compliment.delete({
      where: { id: complimentId }
    });

    return NextResponse.json({
      success: true,
      message: 'Compliment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting compliment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete compliment' },
      { status: 500 }
    );
  }
}