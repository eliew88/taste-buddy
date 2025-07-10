/**
 * Create Test Notification
 * 
 * Creates a test notification to verify the system works
 */

const { PrismaClient } = require('@prisma/client');

async function createTestNotification() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Creating test notification...\n');
    
    // Get the first user to create a notification for
    const user = await prisma.user.findFirst({
      select: { id: true, email: true, name: true }
    });
    
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`📧 Creating notification for user: ${user.email}`);
    
    // Create a test notification
    const notification = await prisma.notification.create({
      data: {
        type: 'NEW_FOLLOWER',
        title: 'Test Notification',
        message: 'This is a test notification to verify the system works!',
        userId: user.id,
        fromUserId: user.id, // Self-notification for testing
      },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        },
        fromUser: {
          select: { id: true, email: true, name: true }
        }
      }
    });
    
    console.log('✅ Test notification created successfully!');
    console.log('📄 Notification details:', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      createdAt: notification.createdAt,
      recipient: notification.user.email,
      sender: notification.fromUser?.email
    });
    
    // Check notification count
    const totalNotifications = await prisma.notification.count();
    console.log(`\n📊 Total notifications in database: ${totalNotifications}`);
    
    console.log('\n🎯 Next steps:');
    console.log('1. Start the dev server and sign in');
    console.log('2. Check the notification bell - you should see 1 unread notification');
    console.log('3. Test the "Mark as Read" functionality');
    
  } catch (error) {
    console.error('❌ Error creating test notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestNotification().catch(console.error);