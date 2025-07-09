import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('=== FOLLOW STATUS DEBUG ===');
    console.log('Session:', session ? 'Authenticated' : 'Not authenticated');
    console.log('User ID:', session?.user?.id);
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        debug: {
          session: !!session,
          userId: session?.user?.id
        }
      });
    }

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 5
    });

    console.log('Available users:', users.length);
    console.log('Users:', users.map(u => ({ id: u.id, name: u.name, email: u.email })));

    // Get follow relationships
    const follows = await prisma.follow.findMany({
      include: {
        follower: { select: { name: true, email: true } },
        following: { select: { name: true, email: true } }
      },
      take: 10
    });

    console.log('Follow relationships:', follows.length);
    console.log('Follows:', follows.map(f => ({
      follower: f.follower.email,
      following: f.following.email
    })));

    return NextResponse.json({
      success: true,
      data: {
        currentUser: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email
        },
        users,
        follows,
        totalUsers: users.length,
        totalFollows: follows.length
      }
    });
  } catch (error) {
    console.error('Follow status debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}