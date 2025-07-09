import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    console.log('Testing follows table...');
    
    // Try to query the follows table
    const followCount = await prisma.follow.count();
    
    console.log('Follows table exists. Count:', followCount);
    
    return NextResponse.json({
      success: true,
      message: 'Follows table exists',
      followCount
    });
    
  } catch (error: any) {
    console.error('Follows table test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}