/**
 * Compliments API Routes
 * 
 * Handles CRUD operations for chef compliments with privacy controls.
 * 
 * POST /api/compliments - Send a compliment to a chef
 * GET /api/compliments?toUserId=... - Get compliments for a specific user (private, only recipient can see)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { createComplimentNotification } from '@/lib/notification-utils';
import { isFeatureEnabled } from '@/lib/feature-flags';

/**
 * Validation schema for creating compliments
 */
const createComplimentSchema = z.object({
  type: z.enum(['message', 'tip']).default('message'),
  message: z.string().min(1, 'Compliment message is required').max(500, 'Message too long'),
  tipAmount: z.number().min(0.50).max(100).optional(), // $0.50 to $100 range
  isAnonymous: z.boolean().default(false),
  toUserId: z.string().min(1, 'Recipient user ID is required'),
  recipeId: z.string().optional(), // Optional recipe context
});

/**
 * GET /api/compliments?toUserId=...
 * 
 * Retrieves compliments for a specific user. Only the recipient can see their own compliments.
 * This maintains privacy - compliments are private between sender and recipient.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const toUserId = searchParams.get('toUserId');

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!toUserId) {
      return NextResponse.json(
        { success: false, error: 'toUserId parameter is required' },
        { status: 400 }
      );
    }

    // Privacy check: Only allow users to see their own received compliments
    if (session.user.id !== toUserId) {
      return NextResponse.json(
        { success: false, error: 'You can only view your own compliments' },
        { status: 403 }
      );
    }

    // Fetch compliments for the user
    const compliments = await prisma.compliment.findMany({
      where: {
        toUserId: toUserId
      },
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
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to handle anonymous compliments
    const transformedCompliments = compliments.map(compliment => ({
      ...compliment,
      fromUser: compliment.isAnonymous ? {
        id: 'anonymous',
        name: 'Anonymous',
        image: null
      } : compliment.fromUser
    }));

    return NextResponse.json({
      success: true,
      data: transformedCompliments
    });

  } catch (error) {
    console.error('Error fetching compliments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compliments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/compliments
 * 
 * Sends a compliment to a chef
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
    const validatedData = createComplimentSchema.parse(body);

    // Check if tipping is allowed when type is 'tip'
    if (validatedData.type === 'tip') {
      if (!isFeatureEnabled('enablePayments')) {
        return NextResponse.json(
          { success: false, error: 'Tipping is currently disabled' },
          { status: 403 }
        );
      }
      
      if (!validatedData.tipAmount || validatedData.tipAmount < 0.50) {
        return NextResponse.json(
          { success: false, error: 'Tip amount must be at least $0.50' },
          { status: 400 }
        );
      }
    }

    // Validate that user isn't complimenting themselves
    if (validatedData.toUserId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot compliment yourself' },
        { status: 400 }
      );
    }

    // Verify recipient user exists and get sender info
    const [recipientUser, senderUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: validatedData.toUserId },
        select: { id: true, name: true, email: true }
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true }
      })
    ]);

    if (!recipientUser) {
      return NextResponse.json(
        { success: false, error: 'Recipient user not found' },
        { status: 404 }
      );
    }

    if (!senderUser) {
      return NextResponse.json(
        { success: false, error: 'Sender user not found' },
        { status: 404 }
      );
    }

    // If recipe is specified, verify it exists and belongs to the recipient
    let recipe = null;
    if (validatedData.recipeId) {
      recipe = await prisma.recipe.findUnique({
        where: { id: validatedData.recipeId },
        select: { id: true, authorId: true, title: true }
      });

      if (!recipe) {
        return NextResponse.json(
          { success: false, error: 'Recipe not found' },
          { status: 404 }
        );
      }

      if (recipe.authorId !== validatedData.toUserId) {
        return NextResponse.json(
          { success: false, error: 'Recipe does not belong to the specified user' },
          { status: 400 }
        );
      }
    }

    // For tip compliments, validate tip amount
    if (validatedData.type === 'tip') {
      if (!validatedData.tipAmount || validatedData.tipAmount < 0.50) {
        return NextResponse.json(
          { success: false, error: 'Tip amount must be at least $0.50' },
          { status: 400 }
        );
      }
      // Note: Payment processing will be implemented later
      // For now, tips are just recorded with "pending" status
    }

    // Create the compliment
    const compliment = await prisma.compliment.create({
      data: {
        type: validatedData.type,
        message: validatedData.message,
        tipAmount: validatedData.tipAmount,
        isAnonymous: validatedData.isAnonymous,
        fromUserId: session.user.id,
        toUserId: validatedData.toUserId,
        recipeId: validatedData.recipeId,
        // Payment fields will be updated when payment processing is implemented
        paymentStatus: validatedData.type === 'tip' ? 'pending' : 'completed'
      },
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
            title: true
          }
        }
      }
    });

    // Create notification for compliment recipient
    try {
      const senderName = senderUser.name || senderUser.email;
      const tipAmount = validatedData.type === 'tip' ? validatedData.tipAmount : undefined;
      const recipeTitle = recipe?.title;
      
      await createComplimentNotification(
        session.user.id,
        validatedData.toUserId,
        compliment.id,
        senderName,
        tipAmount,
        recipeTitle,
        validatedData.isAnonymous
      );
    } catch (error) {
      console.error('Failed to create compliment notification:', error);
      // Don't fail the compliment creation if notification fails
    }

    return NextResponse.json({
      success: true,
      data: compliment
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating compliment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create compliment' },
      { status: 500 }
    );
  }
}