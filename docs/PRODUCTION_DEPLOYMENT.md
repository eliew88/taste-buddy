# Production Deployment Guide

This guide covers deploying TasteBuddy to production with B2 cloud storage.

## Prerequisites

- ✅ Production PostgreSQL database
- ✅ Production B2 bucket with app keys
- ✅ Domain name and SSL certificate
- ✅ Deployment platform (Vercel, Railway, etc.)

## Environment Configuration

### Required Environment Variables

Copy these variables to your production environment:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/tastebuddy_prod"

# Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secure-production-secret"

# B2 Cloud Storage
B2_ENDPOINT="https://s3.us-east-005.backblazeb2.com"
B2_REGION="us-east-005"
B2_ACCESS_KEY_ID="your-prod-key-id"
B2_SECRET_ACCESS_KEY="your-prod-app-key"
B2_BUCKET_NAME="tastebuddy-images-prod"
B2_PUBLIC_URL="https://f005.backblazeb2.com/file/tastebuddy-images-prod"

# Environment
NODE_ENV="production"
```

## Platform-Specific Setup

### Vercel Deployment

1. **Connect Repository**
   ```bash
   vercel --prod
   ```

2. **Set Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all production environment variables
   - Ensure they're set for "Production" environment

3. **Database Migration**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Railway Deployment

1. **Create New Project**
   ```bash
   railway login
   railway new tastebuddy-prod
   ```

2. **Set Environment Variables**
   ```bash
   railway variables set DATABASE_URL="your-prod-db-url"
   railway variables set NEXTAUTH_URL="https://your-domain.com"
   railway variables set B2_ACCESS_KEY_ID="your-prod-key"
   # ... set all other variables
   ```

3. **Deploy**
   ```bash
   railway up
   ```

### Docker Deployment

1. **Build Production Image**
   ```bash
   docker build -t tastebuddy-prod .
   ```

2. **Run with Environment File**
   ```bash
   docker run -d \
     --env-file .env.production \
     -p 3000:3000 \
     tastebuddy-prod
   ```

## Pre-Deployment Checklist

### B2 Configuration
- [ ] Production bucket created and configured as "Public"
- [ ] Production app keys generated with read/write access
- [ ] CORS settings configured if needed
- [ ] Lifecycle rules set up (optional)

### Database
- [ ] Production PostgreSQL database provisioned
- [ ] Database migrations applied: `npx prisma migrate deploy`
- [ ] Seed data loaded: `npx prisma db seed`
- [ ] Connection string tested

### Domain & SSL
- [ ] Domain DNS configured
- [ ] SSL certificate installed
- [ ] NEXTAUTH_URL matches production domain

### Security
- [ ] NEXTAUTH_SECRET is cryptographically secure
- [ ] B2 credentials are production keys (not dev)
- [ ] Database credentials are secure
- [ ] Environment variables are not committed to git

## Post-Deployment Testing

### 1. Basic Functionality
```bash
# Test homepage
curl https://your-domain.com

# Test B2 connectivity
curl https://your-domain.com/api/test-b2
```

### 2. Image Upload Test
1. Go to your production site
2. Sign up/sign in
3. Create a new recipe with image upload
4. Verify image displays correctly
5. Check that image URL starts with your production B2 URL

### 3. Database Verification
```bash
# Connect to production database
psql $DATABASE_URL

# Check recipes table
SELECT id, title, image FROM recipes WHERE image IS NOT NULL LIMIT 5;
```

## Monitoring & Maintenance

### Health Checks
- Set up uptime monitoring for your domain
- Monitor B2 usage and costs in Backblaze dashboard
- Monitor database performance and storage

### Backup Strategy
- Database: Set up automated backups
- B2 Images: Consider lifecycle rules for old images
- Code: Ensure git repository is backed up

### Cost Optimization
- Monitor B2 storage and bandwidth usage
- Set up alerts for unusual usage spikes
- Consider image compression for large uploads

## Troubleshooting

### Common Issues

**1. Images not displaying**
- Check B2_PUBLIC_URL format matches your bucket
- Verify bucket is set to "Public"
- Test direct image URLs in browser

**2. Upload failures**
- Verify B2 credentials are correct
- Check B2 bucket permissions
- Look for CORS issues in browser console

**3. Database connection errors**
- Verify DATABASE_URL format
- Check network connectivity to database
- Ensure database accepts connections from your deployment IP

### Debug Mode
Enable verbose logging:
```bash
DEBUG=b2:*,prisma:*
```

## Security Best Practices

1. **Environment Variables**
   - Never commit production credentials to git
   - Use deployment platform's secret management
   - Rotate credentials regularly

2. **B2 Security**
   - Use application keys with minimal required permissions
   - Monitor B2 access logs for unusual activity
   - Set up bucket notifications for large uploads

3. **Database Security**
   - Use connection pooling
   - Enable SSL connections
   - Regular security updates

## Scaling Considerations

As your application grows:

- **CDN**: Consider adding Cloudflare in front of B2
- **Database**: Monitor connection pool usage
- **Images**: Implement image optimization/resizing
- **Monitoring**: Add application performance monitoring

## Support

For deployment issues:
- Check the troubleshooting section above
- Review platform-specific documentation
- Check B2 status page for service issues