import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      DATABASE_POSTGRES_URL: process.env.DATABASE_POSTGRES_URL ? 'SET' : 'NOT SET',
      DATABASE_PRISMA_DATABASE_URL: process.env.DATABASE_PRISMA_DATABASE_URL ? 'SET' : 'NOT SET',
      DATABASE_DATABASE_URL: process.env.DATABASE_DATABASE_URL ? 'SET' : 'NOT SET'
    };

    return NextResponse.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      envVars,
      allEnvKeys: Object.keys(process.env).filter(key => 
        key.includes('DATABASE') || key.includes('NEXTAUTH') || key.includes('VERCEL')
      )
    });
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}