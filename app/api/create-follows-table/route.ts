import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    console.log('Creating follows table...');
    
    // Create the follows table using raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "follows" (
          "id" TEXT NOT NULL,
          "followerId" TEXT NOT NULL,
          "followingId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
      )
    `;
    
    console.log('Creating indexes...');
    
    // Create indexes (using IF NOT EXISTS for safety)
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "follows_followerId_followingId_key" 
      ON "follows"("followerId", "followingId")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "follows_followerId_idx" 
      ON "follows"("followerId")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "follows_followingId_idx" 
      ON "follows"("followingId")
    `;
    
    console.log('Adding foreign key constraints...');
    
    // Add foreign key constraints (check if they exist first)
    await prisma.$executeRaw`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'follows_followerId_fkey'
        ) THEN
          ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" 
          FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `;
    
    await prisma.$executeRaw`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'follows_followingId_fkey'
        ) THEN
          ALTER TABLE "follows" ADD CONSTRAINT "follows_followingId_fkey" 
          FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `;
    
    console.log('Testing table access...');
    
    // Test that we can access the table
    const count = await prisma.follow.count();
    
    console.log('Success! Follows table created. Count:', count);
    
    return NextResponse.json({
      success: true,
      message: 'Follows table created successfully',
      count
    });
    
  } catch (error) {
    console.error('Error creating follows table:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}