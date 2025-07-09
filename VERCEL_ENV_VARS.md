# Vercel Environment Variables for TasteBuddy Production

Copy these environment variables to your Vercel project dashboard.

## Required Environment Variables

### Database Configuration
```
DATABASE_URL=postgresql://your-prod-db-connection-string
```

### NextAuth Configuration
```
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=your-super-secure-production-secret-at-least-32-chars
```

### Backblaze B2 Production Configuration
```
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_ACCESS_KEY_ID=your-production-b2-key-id
B2_SECRET_ACCESS_KEY=your-production-b2-application-key
B2_BUCKET_NAME=tastebuddy-images-prod
B2_PUBLIC_URL=https://f005.backblazeb2.com/file/tastebuddy-images-prod
```

### Environment Settings
```
NODE_ENV=production
```

## How to Add in Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your TasteBuddy project
3. Go to Settings → Environment Variables
4. Add each variable above with their actual values
5. Set Environment: "Production" for all variables
6. Click "Save"

## Important Notes

- Replace all placeholder values with your actual production credentials
- Use your PRODUCTION B2 app keys (not development keys)
- Ensure NEXTAUTH_URL matches your Vercel domain exactly
- Generate a secure NEXTAUTH_SECRET (32+ random characters)
- Double-check B2_PUBLIC_URL matches your production bucket name exactly