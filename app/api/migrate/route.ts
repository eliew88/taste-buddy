/**
 * Database Migration API Route
 * 
 * This endpoint applies the current Prisma schema to the production database.
 * It should only be used for fixing schema mismatches.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    console.log('🚀 Starting database schema verification...');
    
    // First, let's check what tables exist
    const tableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tables = await prisma.$queryRawUnsafe(tableQuery) as Array<{ table_name: string }>;
    console.log('📊 Existing tables:', tables.map(t => t.table_name));
    
    // Check if ingredient_entries table exists
    const hasIngredientEntries = tables.some(t => t.table_name === 'ingredient_entries');
    const hasCompliments = tables.some(t => t.table_name === 'compliments');
    
    let operations = [];
    
    if (!hasIngredientEntries) {
      console.log('🔧 Creating ingredient_entries table...');
      operations.push('ingredient_entries table creation');
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "ingredient_entries" (
          "id" TEXT NOT NULL,
          "amount" DOUBLE PRECISION NOT NULL,
          "unit" TEXT,
          "ingredient" TEXT NOT NULL,
          "recipeId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "ingredient_entries_pkey" PRIMARY KEY ("id")
        );
      `);
      
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "ingredient_entries_recipeId_idx" ON "ingredient_entries"("recipeId");
      `);
      
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "ingredient_entries_ingredient_idx" ON "ingredient_entries"("ingredient");
      `);
      
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "ingredient_entries" 
        ADD CONSTRAINT "ingredient_entries_recipeId_fkey" 
        FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    }
    
    if (!hasCompliments) {
      console.log('🔧 Creating compliments table...');
      operations.push('compliments table creation');
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "compliments" (
          "id" TEXT NOT NULL,
          "type" TEXT NOT NULL DEFAULT 'message',
          "message" TEXT NOT NULL,
          "tipAmount" DECIMAL(65,30),
          "currency" TEXT NOT NULL DEFAULT 'USD',
          "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
          "paymentId" TEXT,
          "paymentDate" TIMESTAMP(3),
          "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "fromUserId" TEXT NOT NULL,
          "toUserId" TEXT NOT NULL,
          "recipeId" TEXT,
          CONSTRAINT "compliments_pkey" PRIMARY KEY ("id")
        );
      `);
      
      // Add indexes and foreign keys for compliments
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "compliments_toUserId_idx" ON "compliments"("toUserId");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "compliments_fromUserId_idx" ON "compliments"("fromUserId");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "compliments_recipeId_idx" ON "compliments"("recipeId");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "compliments_type_idx" ON "compliments"("type");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "compliments_paymentStatus_idx" ON "compliments"("paymentStatus");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "compliments_createdAt_idx" ON "compliments"("createdAt");
      `);
      
      // Add foreign keys
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "compliments" 
        ADD CONSTRAINT "compliments_fromUserId_fkey" 
        FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "compliments" 
        ADD CONSTRAINT "compliments_toUserId_fkey" 
        FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "compliments" 
        ADD CONSTRAINT "compliments_recipeId_fkey" 
        FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      `);
    }
    
    // Check if recipes table still has old ingredients column
    const recipeColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'recipes' AND table_schema = 'public'
      ORDER BY column_name;
    `;
    
    const recipeColumns = await prisma.$queryRawUnsafe(recipeColumnsQuery) as Array<{ column_name: string }>;
    const hasOldIngredientsColumn = recipeColumns.some(c => c.column_name === 'ingredients');
    
    if (hasOldIngredientsColumn) {
      console.log('🔧 Removing old ingredients column from recipes table...');
      operations.push('old ingredients column removal');
      
      // First drop the index
      await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "recipes_ingredients_idx";`);
      
      // Then drop the column
      await prisma.$executeRawUnsafe(`ALTER TABLE "recipes" DROP COLUMN IF EXISTS "ingredients";`);
    }
    
    console.log('✅ Database schema migration completed!');
    
    return NextResponse.json({
      success: true,
      message: 'Database schema updated successfully',
      operations: operations,
      tablesFound: tables.map(t => t.table_name),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}