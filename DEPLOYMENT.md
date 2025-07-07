# TasteBuddy Deployment Guide

This guide walks you through deploying TasteBuddy to production with a robust database and secure configuration.

## 🚀 Quick Start (Recommended: Vercel + PostgreSQL)

### Step 1: Prepare for Production

1. **Generate Production Secrets**:
```bash
# Generate a secure NextAuth secret
openssl rand -base64 32
```

2. **Choose Your Database**:
   - **Vercel Postgres** (Recommended): Integrated with Vercel
   - **Supabase**: Free PostgreSQL with additional features
   - **Railway**: Simple PostgreSQL hosting
   - **Turso**: SQLite-compatible for minimal changes

### Step 2: Deploy to Vercel

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy from your project directory**:
```bash
vercel
```

3. **Set Environment Variables** in Vercel Dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_URL`: Your deployed app URL (e.g., `https://tastebuddy.vercel.app`)
   - `NEXTAUTH_SECRET`: The secret you generated above

### Step 3: Set Up Production Database

#### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to "Storage" tab
3. Create a new Postgres database
4. Copy the connection string to `DATABASE_URL`

#### Option B: Supabase (Free Alternative)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy connection string (use "URI" format)
5. Set as `DATABASE_URL`

### Step 4: Database Migration

1. **Switch to PostgreSQL schema**:
```bash
# Backup current schema
cp prisma/schema.prisma prisma/schema-sqlite.prisma

# Use PostgreSQL schema
cp prisma/schema-postgres.prisma prisma/schema.prisma
```

2. **Generate and deploy migration**:
```bash
npx prisma generate
npx prisma db push
```

3. **Seed production database**:
```bash
npm run db:seed
```

### Step 5: Verify Deployment

1. Visit your deployed URL
2. Test user registration and login
3. Create a recipe
4. Test favorites and ratings functionality
5. Verify all features work correctly

## 🔧 Alternative Deployment Options

### Railway

1. **Connect GitHub repo** at [railway.app](https://railway.app)
2. **Add PostgreSQL service** in Railway dashboard
3. **Set environment variables**:
   - `DATABASE_URL`: Provided by Railway
   - `NEXTAUTH_URL`: Your Railway app URL
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

### Netlify + External Database

1. **Build for static export** (requires API route adjustments):
```bash
npm run build
```

2. **Deploy to Netlify**
3. **Use external database** (Supabase, PlanetScale, etc.)

## 🗄️ Database Migration from SQLite

### Automatic Migration (Recommended)

We've created a migration-friendly setup. The key changes:

1. **PostgreSQL Schema**: Uses native arrays instead of JSON strings
2. **API Updates**: Automatic handling of both formats during transition
3. **Data Migration**: Custom scripts for moving existing data

### Manual Data Migration

If you have important development data to preserve:

```bash
# Export SQLite data
npx prisma db pull --schema=prisma/schema-sqlite.prisma

# Create migration script
# (Custom script needed for data transformation)

# Import to PostgreSQL
npx prisma db push --schema=prisma/schema-postgres.prisma
```

## 🔒 Security Configuration

### Production Environment Variables

```bash
# Required for production
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-very-secure-secret-here"

# Optional but recommended
NODE_ENV="production"
```

### NextAuth.js Security

1. **Strong Secret**: Use a cryptographically secure secret
2. **HTTPS Only**: Ensure your deployment URL uses HTTPS
3. **Secure Cookies**: Automatically handled in production
4. **CSRF Protection**: Built into NextAuth.js

## 📊 Performance Optimization

### Database Optimizations

1. **Connection Pooling**: Enabled by default in PostgreSQL
2. **Indexing**: Pre-configured in schema for optimal performance
3. **Query Optimization**: Prisma generates efficient queries

### Frontend Optimizations

1. **Image Optimization**: Consider Next.js Image component
2. **Static Generation**: Pre-render pages where possible
3. **Code Splitting**: Automatic with Next.js

## 🔍 Monitoring and Debugging

### Logging

1. **Application Logs**: Available in Vercel/Railway dashboard
2. **Database Logs**: Available in database provider dashboard
3. **Error Tracking**: Consider adding Sentry for production

### Health Checks

Create a health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected' // Add actual DB health check
  });
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection**: Verify DATABASE_URL format and credentials
2. **NextAuth Errors**: Check NEXTAUTH_URL and NEXTAUTH_SECRET
3. **Build Failures**: Review logs for missing dependencies or type errors
4. **Runtime Errors**: Check environment variables and database schema

### Getting Help

1. Check deployment logs in your platform dashboard
2. Verify all environment variables are set correctly
3. Test database connectivity independently
4. Review Next.js and Prisma documentation

## 📋 Deployment Checklist

- [ ] Generate secure NextAuth secret
- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Deploy application
- [ ] Run database migrations
- [ ] Seed initial data
- [ ] Test all functionality
- [ ] Set up monitoring (optional)
- [ ] Configure custom domain (optional)

## 🎯 Next Steps After Deployment

1. **Custom Domain**: Point your domain to the deployment
2. **Analytics**: Add Google Analytics or similar
3. **Error Monitoring**: Implement Sentry or similar service
4. **Performance Monitoring**: Use Vercel Analytics or similar
5. **Backups**: Set up automated database backups
6. **CI/CD**: Configure automated deployments from Git

Your TasteBuddy application is now ready for production! 🎉