/**
 * Script to add sample images to existing recipes
 * 
 * Usage: node scripts/add-recipe-images.js
 * 
 * This script will:
 * 1. Find recipes without images
 * 2. Add sample food images to them
 * 3. Make them suitable for the hero background
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Actual images that exist in public/images/recipes/
const SAMPLE_IMAGES = [
  '/images/recipes/beansandcorn.jpeg',
  '/images/recipes/budino.jpeg',
  '/images/recipes/download.jpeg',
  '/images/recipes/greencurry.jpeg',
  // These will cycle if you have more than 4 recipes
  '/images/recipes/beansandcorn.jpeg',
  '/images/recipes/budino.jpeg',
  '/images/recipes/download.jpeg',
  '/images/recipes/greencurry.jpeg',
];

async function addImagesToRecipes() {
  try {
    console.log('🔍 Finding recipes without images...');
    
    // Find recipes without images
    const recipesWithoutImages = await prisma.recipe.findMany({
      where: {
        image: null
      },
      select: {
        id: true,
        title: true,
        image: true
      }
    });

    console.log(`📋 Found ${recipesWithoutImages.length} recipes without images`);

    if (recipesWithoutImages.length === 0) {
      console.log('✅ All recipes already have images!');
      return;
    }

    // Add images to recipes
    for (let i = 0; i < recipesWithoutImages.length; i++) {
      const recipe = recipesWithoutImages[i];
      const imageUrl = SAMPLE_IMAGES[i % SAMPLE_IMAGES.length];
      
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { image: imageUrl }
      });
      
      console.log(`📸 Added image to "${recipe.title}": ${imageUrl}`);
    }

    console.log('\n✅ Successfully added images to all recipes!');
    console.log('\n📝 Next steps:');
    console.log('1. Add actual images to public/images/recipes/');
    console.log('2. The hero background will now show your recipe images');
    console.log('3. You can replace the sample images with your own food photos');

  } catch (error) {
    console.error('❌ Error adding images to recipes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addImagesToRecipes();