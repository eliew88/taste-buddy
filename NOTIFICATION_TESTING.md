# Notification System Testing Guide

## 🧪 Testing Checklist

### Phase 1: Basic API Testing
- [ ] Test notification API endpoints respond correctly
- [ ] Test notification preferences API works
- [ ] Verify authentication is required for endpoints
- [ ] Check API response formats match expected schema

### Phase 2: UI Component Testing
- [ ] Navigate to Settings page (/profile/privacy)
- [ ] Verify Notifications tab appears
- [ ] Test notification preference toggles
- [ ] Verify preferences save and persist
- [ ] Check notification bell component loads

### Phase 3: Notification Creation Testing
Create test scenarios to trigger each notification type:

#### 3.1 New Follower Notifications
- [ ] User A follows User B
- [ ] User B should receive "New Follower" notification
- [ ] Verify notification appears in notification bell
- [ ] Check notification contains correct user information

#### 3.2 Recipe Comment Notifications  
- [ ] User A comments on User B's recipe
- [ ] User B should receive "Recipe Comment" notification
- [ ] Verify notification links to correct recipe
- [ ] Test that private comments don't create notifications

#### 3.3 Compliment Notifications
- [ ] User A sends compliment to User B
- [ ] User B should receive "Compliment Received" notification
- [ ] Test both message and tip compliments
- [ ] Verify tip amounts are displayed correctly

#### 3.4 New Recipe Notifications
- [ ] User A posts a new recipe
- [ ] Users following A should receive "New Recipe" notifications
- [ ] Verify all followers get notified
- [ ] Check recipe information is included

### Phase 4: Notification Preferences Testing
- [ ] Disable "New Follower" notifications
- [ ] Follow someone - verify no notification is created
- [ ] Re-enable notifications - verify they work again
- [ ] Test each notification type toggle
- [ ] Test email notification preferences

### Phase 5: Notification Management Testing
- [ ] Mark individual notifications as read
- [ ] Mark all notifications as read
- [ ] Verify unread count updates correctly
- [ ] Test notification bell behavior with 0 notifications

## 🚀 Quick Test Commands

### Run API Tests
```bash
node test-notifications.js
```

### Check Database for Notifications
```bash
npx prisma studio
# Navigate to Notification table to see created notifications
```

### Verify Prisma Schema
```bash
npx prisma validate
npx prisma generate
```

## 🐛 Common Issues to Check

1. **Authentication Issues**: Ensure you're signed in when testing
2. **Database Connection**: Verify DATABASE_URL is set correctly
3. **Prisma Client**: Make sure `npx prisma generate` has been run
4. **API Responses**: Check console for any API errors
5. **TypeScript Errors**: Ensure no compilation errors exist

## 📊 Expected Results

### Successful Test Indicators:
- ✅ Notifications appear in the notification bell
- ✅ Unread count updates when new notifications arrive
- ✅ Notification preferences save correctly
- ✅ All notification types can be triggered
- ✅ No console errors during normal usage
- ✅ Database contains notification records

### Troubleshooting Steps:
1. Check browser console for JavaScript errors
2. Check server console for API errors
3. Verify database schema with Prisma Studio
4. Test API endpoints directly with test script
5. Ensure all environment variables are set

## 🎯 Test User Setup

For comprehensive testing, you'll need at least 2 test users:
1. **User A**: The actor (follows, comments, sends compliments)
2. **User B**: The recipient (receives notifications)

You can use the existing demo accounts:
- sarah@example.com / demo
- mike@example.com / demo  
- david@example.com / demo