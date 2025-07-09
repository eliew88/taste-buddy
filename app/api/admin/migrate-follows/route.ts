import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    console.log('🔍 Checking if follows table exists...');
    
    // Check if follows table already exists
    try {
      await prisma.follow.findFirst();
      return NextResponse.json({
        success: true,
        message: 'Follows table already exists. No migration needed.',
        alreadyExists: true
      });
    } catch (error: any) {
      if (error.code !== 'P2021') {
        throw error;
      }
      console.log('📋 Follows table does not exist. Applying migration...');
    }
    
    console.log('🚀 Creating follows table...');
    
    // Create the follows table
    await prisma.$executeRaw`
      CREATE TABLE "follows" (
          "id" TEXT NOT NULL,
          "followerId" TEXT NOT NULL,
          "followingId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
      )
    `;
    
    console.log('📊 Creating indexes...');
    
    // Create indexes
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "follows"("followerId", "followingId")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX "follows_followerId_idx" ON "follows"("followerId")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX "follows_followingId_idx" ON "follows"("followingId")
    `;
    
    console.log('🔗 Adding foreign key constraints...');
    
    // Add foreign key constraints
    await prisma.$executeRaw`
      ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" 
      FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "follows" ADD CONSTRAINT "follows_followingId_fkey" 
      FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `;
    
    console.log('🔍 Verifying table creation...');
    
    // Verify the table was created by running a simple query
    await prisma.follow.findMany({ take: 1 });
    
    console.log('✅ Migration completed successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Follows table created successfully!',
      migrationApplied: true
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed',
      details: error
    }, { status: 500 });
  }
}