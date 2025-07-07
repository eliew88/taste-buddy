import { PrismaClient } from '@prisma/client';
import { arrayToJson } from '../lib/sqlite-helpers';

const prisma = new PrismaClient();

async function main() {
  // Create sample user
  const user = await prisma.user.upsert({
    where: { email: 'demo@tastebuddy.com' },
    update: {},
    create: {
      email: 'demo@tastebuddy.com',
      name: 'TasteBuddy Demo User',
    },
  });

  // Create sample recipes with JSON arrays
  const chocolateChipCookies = await prisma.recipe.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      title: 'Classic Chocolate Chip Cookies',
      description: 'These classic chocolate chip cookies are crispy on the outside and chewy on the inside.',
      ingredients: arrayToJson([
        '2 cups all-purpose flour',
        '1 cup butter, softened',
        '3/4 cup brown sugar',
        '1/2 cup white sugar',
        '2 large eggs',
        '2 tsp vanilla extract',
        '1 tsp baking soda',
        '1 tsp salt',
        '2 cups chocolate chips'
      ]),
      instructions: 'Preheat oven to 375°F. In a large bowl, cream together butter and sugars until light and fluffy...',
      cookTime: '25 mins',
      servings: 36,
      difficulty: 'easy',
      tags: arrayToJson(['dessert', 'cookies', 'chocolate', 'baking']),
      authorId: user.id,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });