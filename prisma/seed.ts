import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
// Removed - no longer needed

const prisma = new PrismaClient();

/**
 * Sample users for the recipe platform with hashed passwords
 */
async function createSampleUsers() {
  const hashedPassword = await bcrypt.hash('demo', 12);
  
  return [
    {
      id: 'user1',
      email: 'sarah@example.com',
      name: 'Sarah Chen',
      image: null,
      password: hashedPassword,
    },
    {
      id: 'user2',
      email: 'mike@example.com',
      name: 'Mike Rodriguez',
      image: null,
      password: hashedPassword,
    },
    {
      id: 'user3',
      email: 'david@example.com',
      name: 'David Kim',
      image: null,
      password: hashedPassword,
    },
    {
      id: 'temp-user-id',
      email: 'temp@example.com',
      name: 'Temp User',
      image: null,
      password: hashedPassword,
    }
  ];
}

/**
 * Sample recipes with realistic data
 */
const sampleRecipes = [
  {
    id: 'recipe1',
    title: 'Classic Chocolate Chip Cookies',
    description: 'These classic chocolate chip cookies are crispy on the outside and chewy on the inside. Perfect for any occasion and loved by both kids and adults. The secret is using both brown and white sugar for the perfect texture.',
    ingredients: [
      '2 cups all-purpose flour',
      '1 cup butter, softened',
      '3/4 cup brown sugar, packed',
      '1/2 cup white sugar',
      '2 large eggs',
      '2 tsp vanilla extract',
      '1 tsp baking soda',
      '1 tsp salt',
      '2 cups chocolate chips',
    ],
    instructions: `1. Preheat your oven to 375°F (190°C). Line baking sheets with parchment paper.

2. In a large bowl, cream together the softened butter, brown sugar, and white sugar until light and fluffy (about 3-4 minutes with an electric mixer).

3. Beat in eggs one at a time, then add vanilla extract. Mix until well combined.

4. In a separate bowl, whisk together flour, baking soda, and salt.

5. Gradually mix the dry ingredients into the wet ingredients until just combined. Don't overmix.

6. Stir in the chocolate chips until evenly distributed.

7. Drop rounded tablespoons of dough onto the prepared baking sheets, spacing them about 2 inches apart.

8. Bake for 9-11 minutes, or until edges are golden brown but centers still look slightly underbaked.

9. Let cool on the baking sheet for 5 minutes before transferring to a wire rack.

10. Store in an airtight container for up to one week.`,
    cookTime: '25 mins',
    servings: 36,
    difficulty: 'easy',
    tags: ['dessert', 'cookies', 'chocolate', 'baking', 'family-friendly'],
    authorId: 'user1',
  },
  {
    id: 'recipe2',
    title: 'Creamy Chicken Alfredo',
    description: 'Rich and indulgent Alfredo sauce with tender chicken breast and perfectly cooked fettuccine. This restaurant-quality dish is surprisingly easy to make at home and comes together in just 30 minutes.',
    ingredients: [
      '1 lb fettuccine pasta',
      '2 chicken breasts, sliced thin',
      '2 cups heavy cream',
      '1 cup grated Parmesan cheese',
      '4 cloves garlic, minced',
      '4 tbsp butter',
      '2 tbsp olive oil',
      'Salt and black pepper to taste',
      'Fresh parsley for garnish',
      '1/4 tsp nutmeg (optional)',
    ],
    instructions: `1. Bring a large pot of salted water to boil. Cook fettuccine according to package directions until al dente. Reserve 1 cup pasta water before draining.

2. Season chicken breasts with salt and pepper. Heat olive oil in a large skillet over medium-high heat.

3. Cook chicken until golden brown and cooked through (165°F internal temperature), about 6-7 minutes per side. Remove and slice into strips.

4. In the same pan, melt butter over medium heat. Add minced garlic and sauté for 1 minute until fragrant.

5. Pour in heavy cream and bring to a gentle simmer. Cook for 2-3 minutes to thicken slightly.

6. Gradually whisk in Parmesan cheese until smooth and creamy. Season with salt, pepper, and nutmeg.

7. Add the cooked pasta to the sauce and toss to coat. Add pasta water as needed to achieve desired consistency.

8. Return sliced chicken to the pan and toss gently.

9. Serve immediately, garnished with fresh parsley and extra Parmesan cheese.`,
    cookTime: '30 mins',
    servings: 4,
    difficulty: 'medium',
    tags: ['dinner', 'pasta', 'chicken', 'italian', 'creamy'],
    authorId: 'user2',
  },
  {
    id: 'recipe3',
    title: 'Spicy Thai Green Curry',
    description: 'Authentic Thai green curry with tender chicken and fresh vegetables in a rich, aromatic coconut broth. This vibrant dish balances sweet, spicy, and savory flavors perfectly. Adjust the heat level to your preference.',
    ingredients: [
      '400ml coconut milk',
      '2-3 tbsp green curry paste',
      '1 lb chicken thigh, cubed',
      '1 Asian eggplant, cubed',
      '1 red bell pepper, sliced',
      '1 cup green beans, trimmed',
      '2 tbsp fish sauce',
      '1 tbsp brown sugar',
      '1 cup Thai basil leaves',
      '2 kaffir lime leaves (optional)',
      '1 red chili, sliced (optional)',
      'Jasmine rice for serving',
    ],
    instructions: `1. Cook jasmine rice according to package directions and keep warm.

2. Heat a wok or large skillet over medium-high heat. Add 2-3 tablespoons of the thick coconut cream from the top of the can.

3. Fry curry paste in the coconut cream for 2-3 minutes until fragrant and the oil separates.

4. Add cubed chicken and cook until no longer pink on the outside, about 5 minutes.

5. Pour in the remaining coconut milk and bring to a gentle simmer.

6. Add fish sauce and brown sugar. Stir to combine and taste for seasoning balance.

7. Add eggplant first (as it takes longest to cook) and simmer for 5 minutes.

8. Add bell pepper and green beans. Cook for another 5-7 minutes until vegetables are tender-crisp.

9. Stir in kaffir lime leaves if using, and half of the Thai basil leaves.

10. Taste and adjust seasoning with more fish sauce, sugar, or curry paste as needed.

11. Serve over jasmine rice, garnished with remaining Thai basil, sliced chili, and lime wedges.`,
    cookTime: '35 mins',
    servings: 4,
    difficulty: 'medium',
    tags: ['asian', 'curry', 'spicy', 'thai', 'coconut', 'dinner'],
    authorId: 'user3',
  },
  {
    id: 'recipe4',
    title: 'Perfect Pancakes',
    description: 'Fluffy, golden pancakes that are perfect for weekend mornings. These pancakes are light, airy, and have just the right amount of sweetness. Serve with maple syrup, fresh berries, or your favorite toppings.',
    ingredients: [
      '2 cups all-purpose flour',
      '2 tbsp sugar',
      '2 tsp baking powder',
      '1 tsp salt',
      '2 large eggs',
      '1 3/4 cups milk',
      '4 tbsp melted butter',
      '1 tsp vanilla extract',
      'Butter for cooking',
    ],
    instructions: `1. In a large bowl, whisk together flour, sugar, baking powder, and salt.

2. In another bowl, whisk together eggs, milk, melted butter, and vanilla extract.

3. Pour the wet ingredients into the dry ingredients and stir just until combined. The batter should be slightly lumpy - don't overmix.

4. Let the batter rest for 5 minutes while you heat the pan.

5. Heat a griddle or large non-stick pan over medium heat. Lightly grease with butter.

6. Pour 1/4 cup of batter for each pancake onto the hot griddle.

7. Cook until bubbles form on the surface and edges look set, about 2-3 minutes.

8. Flip and cook for another 1-2 minutes until golden brown.

9. Serve immediately with butter, maple syrup, and your favorite toppings.`,
    cookTime: '20 mins',
    servings: 4,
    difficulty: 'easy',
    tags: ['breakfast', 'pancakes', 'weekend', 'family-friendly', 'quick'],
    authorId: 'user1',
  },
  {
    id: 'recipe5',
    title: 'Mediterranean Quinoa Bowl',
    description: 'A healthy and colorful bowl packed with Mediterranean flavors. This nutritious meal features quinoa, fresh vegetables, feta cheese, and a zesty lemon herb dressing. Perfect for lunch or a light dinner.',
    ingredients: [
      '1 cup quinoa',
      '2 cups vegetable broth',
      '1 cucumber, diced',
      '2 tomatoes, diced',
      '1/2 red onion, thinly sliced',
      '1/2 cup kalamata olives',
      '1/2 cup feta cheese, crumbled',
      '1/4 cup fresh parsley, chopped',
      '1/4 cup fresh mint, chopped',
      '3 tbsp olive oil',
      '2 tbsp lemon juice',
      '1 tsp oregano',
      'Salt and pepper to taste',
    ],
    instructions: `1. Rinse quinoa under cold water until water runs clear.

2. In a saucepan, bring vegetable broth to a boil. Add quinoa, reduce heat to low, cover and simmer for 15 minutes.

3. Remove from heat and let stand 5 minutes. Fluff with a fork and let cool slightly.

4. While quinoa cools, prepare the vegetables: dice cucumber and tomatoes, slice red onion thinly.

5. For the dressing, whisk together olive oil, lemon juice, oregano, salt, and pepper in a small bowl.

6. In a large bowl, combine the cooked quinoa, cucumber, tomatoes, red onion, and olives.

7. Pour the dressing over the mixture and toss gently to combine.

8. Add crumbled feta cheese, fresh parsley, and mint. Toss lightly.

9. Season with additional salt and pepper if needed.

10. Serve immediately or chill for 30 minutes to let flavors meld. Can be stored in refrigerator for up to 3 days.`,
    cookTime: '25 mins',
    servings: 4,
    difficulty: 'easy',
    tags: ['healthy', 'mediterranean', 'vegetarian', 'quinoa', 'lunch', 'meal-prep'],
    authorId: 'user2',
  },
];

/**
 * Main seeding function
 */
async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data (optional - remove if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await prisma.comment.deleteMany();
    await prisma.rating.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.user.deleteMany();

    // Create users with hashed passwords
    console.log('👥 Creating users...');
    const sampleUsers = await createSampleUsers();
    for (const user of sampleUsers) {
      await prisma.user.create({
        data: user,
      });
      console.log(`   ✓ Created user: ${user.name} (${user.email})`);
    }

    // Create recipes
    console.log('🍳 Creating recipes...');
    for (const recipe of sampleRecipes) {
      const { ingredients, ...recipeData } = recipe;
      
      // Convert string ingredients to structured format
      const structuredIngredients = ingredients.map((ingredient, index) => {
        // Simple parsing for ingredient string format "amount unit ingredient"
        const parts = ingredient.split(' ');
        let amount = 1;
        let unit = undefined;
        let ingredientName = ingredient;
        
        if (parts.length > 1) {
          // Try to parse first part as number
          const maybeAmount = parseFloat(parts[0]);
          if (!isNaN(maybeAmount)) {
            amount = maybeAmount;
            if (parts.length > 2) {
              unit = parts[1];
              ingredientName = parts.slice(2).join(' ');
            } else {
              ingredientName = parts.slice(1).join(' ');
            }
          }
        }
        
        return {
          amount,
          unit,
          ingredient: ingredientName
        };
      });
      
      await prisma.recipe.create({
        data: {
          ...recipeData,
          ingredients: {
            create: structuredIngredients
          }
        }
      });
      console.log(`   ✓ Created recipe: ${recipe.title}`);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Created ${sampleUsers.length} users and ${sampleRecipes.length} recipes`);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

/**
 * Execute the seeding function
 */
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });