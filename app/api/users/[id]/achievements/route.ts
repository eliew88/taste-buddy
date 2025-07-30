import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { evaluateAllAchievements } from '@/lib/achievement-service';

// GET /api/users/[id]/achievements - Get user's achievements
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    
    // Get user's earned achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      },
      orderBy: {
        earnedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: userAchievements
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users/[id]/achievements - Evaluate and award achievements
export async function POST(
  req: NextRequest,
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

    const { id: userId } = await params;
    
    console.log(`Achievement evaluation requested for user: ${userId}`);
    console.log(`Session user ID: ${session.user.id}`);
    
    // Only allow users to evaluate their own achievements or admin functionality
    if (session.user.id !== userId) {
      console.log(`Authorization failed: session user ${session.user.id} cannot evaluate achievements for user ${userId}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Use the centralized achievement service
    const result = await evaluateAllAchievements(userId);
    
    return NextResponse.json({
      success: true,
      data: {
        newAchievements: result.newAchievements,
        evaluated: result.evaluated,
        alreadyEarned: result.alreadyEarned,
        message: result.newAchievements.length > 0 
          ? `Congratulations! You earned ${result.newAchievements.length} new achievement${result.newAchievements.length !== 1 ? 's' : ''}!`
          : 'No new achievements earned at this time.'
      }
    });
  } catch (error) {
    console.error('Evaluate achievements error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}