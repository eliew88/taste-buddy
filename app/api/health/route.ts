import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
    nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
  });
}