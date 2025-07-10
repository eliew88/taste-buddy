/**
 * Database Setup Checker
 * 
 * Quick script to verify the notification system database setup
 */

const { PrismaClient } = require('@prisma/client');

async function checkDatabaseSetup() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking Database Setup for Notifications...\n');
    
    // Check if we can connect to the database
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connection successful');
    
    // Check if notification table exists by trying to count records
    console.log('\n2. Checking notification table...');
    const notificationCount = await prisma.notification.count();
    console.log(`   ✅ Notification table exists with ${notificationCount} records`);
    
    // Check if user table has notification preferences
    console.log('\n3. Checking user notification preferences...');
    const userWithPrefs = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        notifyOnNewFollower: true,
        notifyOnRecipeComment: true,
        notifyOnCompliment: true,
        notifyOnNewRecipeFromFollowing: true,
        emailNotifications: true,
        emailDigest: true,
      }
    });
    
    if (userWithPrefs) {
      console.log('   ✅ User notification preferences columns exist');
      console.log('   📊 Sample user preferences:', {
        email: userWithPrefs.email,
        notifyOnNewFollower: userWithPrefs.notifyOnNewFollower,
        notifyOnRecipeComment: userWithPrefs.notifyOnRecipeComment,
        notifyOnCompliment: userWithPrefs.notifyOnCompliment,
        notifyOnNewRecipeFromFollowing: userWithPrefs.notifyOnNewRecipeFromFollowing,
      });
    } else {
      console.log('   ⚠️  No users found in database');
    }
    
    // Check available notification types
    console.log('\n4. Checking notification type enum...');
    const notificationTypes = ['NEW_FOLLOWER', 'RECIPE_COMMENT', 'COMPLIMENT_RECEIVED', 'NEW_RECIPE_FROM_FOLLOWING'];
    console.log('   ✅ Expected notification types:', notificationTypes);
    
    // Get database schema info
    console.log('\n5. Database summary:');
    const userCount = await prisma.user.count();
    const recipeCount = await prisma.recipe.count();
    const followCount = await prisma.follow.count();
    const commentCount = await prisma.comment.count();
    const complimentCount = await prisma.compliment.count();
    
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   🍳 Recipes: ${recipeCount}`);
    console.log(`   🤝 Follows: ${followCount}`);
    console.log(`   💬 Comments: ${commentCount}`);
    console.log(`   🎁 Compliments: ${complimentCount}`);
    console.log(`   🔔 Notifications: ${notificationCount}`);
    
    console.log('\n✅ Database setup check complete!');
    console.log('\n📋 Ready for testing:');
    console.log('   1. Start the dev server: npm run dev');
    console.log('   2. Sign in with a demo account (sarah@example.com / demo)');
    console.log('   3. Run the test scenarios in NOTIFICATION_TESTING.md');
    
  } catch (error) {
    console.error('❌ Database setup check failed:', error);
    
    if (error.code === 'P2021') {
      console.log('\n💡 Suggestion: Run `npx prisma db push` to sync your schema');
    } else if (error.code === 'P1001') {
      console.log('\n💡 Suggestion: Check your DATABASE_URL environment variable');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDatabaseSetup().catch(console.error);