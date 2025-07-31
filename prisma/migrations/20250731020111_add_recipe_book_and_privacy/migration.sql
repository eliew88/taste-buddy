-- AlterTable: Add isPublic field to recipes (default true for backward compatibility)
ALTER TABLE "recipes" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable: Recipe book categories for organizing saved recipes
CREATE TABLE "recipe_book_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_book_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Recipe book entries for saving recipes to categories
CREATE TABLE "recipe_book_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "categoryId" TEXT,
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_book_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipe_book_categories_userId_idx" ON "recipe_book_categories"("userId");

-- CreateIndex
CREATE INDEX "recipe_book_categories_name_idx" ON "recipe_book_categories"("name");

-- CreateIndex
CREATE INDEX "recipe_book_categories_createdAt_idx" ON "recipe_book_categories"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_book_categories_userId_name_key" ON "recipe_book_categories"("userId", "name");

-- CreateIndex
CREATE INDEX "recipe_book_entries_userId_idx" ON "recipe_book_entries"("userId");

-- CreateIndex
CREATE INDEX "recipe_book_entries_recipeId_idx" ON "recipe_book_entries"("recipeId");

-- CreateIndex
CREATE INDEX "recipe_book_entries_categoryId_idx" ON "recipe_book_entries"("categoryId");

-- CreateIndex
CREATE INDEX "recipe_book_entries_addedAt_idx" ON "recipe_book_entries"("addedAt");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_book_entries_userId_recipeId_categoryId_key" ON "recipe_book_entries"("userId", "recipeId", "categoryId");

-- AddForeignKey
ALTER TABLE "recipe_book_categories" ADD CONSTRAINT "recipe_book_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_book_entries" ADD CONSTRAINT "recipe_book_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_book_entries" ADD CONSTRAINT "recipe_book_entries_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_book_entries" ADD CONSTRAINT "recipe_book_entries_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "recipe_book_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;