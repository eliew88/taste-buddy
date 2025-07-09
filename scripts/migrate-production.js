/**
 * Production Database Migration Script
 * 
 * This script applies the missing follows table migration to production.
 * Run this only once to create the follows table in production.
 */

const { PrismaClient } = require('@prisma/client');

async function applyFollowsMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking if follows table exists...');
    
    // Check if follows table already exists
    try {
      await prisma.follow.findFirst();
      console.log('✅ Follows table already exists. No migration needed.');
      return;
    } catch (error) {
      if (error.code === 'P2021') {
        console.log('📋 Follows table does not exist. Applying migration...');
      } else {
        throw error;
      }
    }
    
    // Apply the migration SQL directly
    const migrationSQL = `
      -- CreateTable
      CREATE TABLE "follows" (
          "id" TEXT NOT NULL,
          "followerId" TEXT NOT NULL,
          "followingId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
      );

      -- CreateIndex
      CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "follows"("followerId", "followingId");

      -- CreateIndex
      CREATE INDEX "follows_followerId_idx" ON "follows"("followerId");

      -- CreateIndex
      CREATE INDEX "follows_followingId_idx" ON "follows"("followingId");

      -- AddForeignKey
      ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

      -- AddForeignKey
      ALTER TABLE "follows" ADD CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    
    console.log('🚀 Executing migration...');
    await prisma.$executeRawUnsafe(migrationSQL);
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the table was created
    const testQuery = await prisma.follow.findMany({ take: 1 });
    console.log('🔍 Verification: follows table is accessible');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  applyFollowsMigration()
    .then(() => {
      console.log('🎉 Production database migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { applyFollowsMigration };