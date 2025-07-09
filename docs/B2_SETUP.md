# Backblaze B2 Cloud Storage Setup

This guide explains how to set up Backblaze B2 cloud storage for TasteBuddy recipe image uploads.

## Benefits of B2 Storage

- **Scalable**: Handle unlimited image uploads
- **Cost-effective**: B2 is significantly cheaper than AWS S3
- **Fast CDN**: Global content delivery network
- **Reliable**: Enterprise-grade reliability and uptime
- **S3-compatible**: Uses standard S3 API for easy migration

## Setup Instructions

### 1. Create a Backblaze B2 Account

1. Go to [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)
2. Sign up for an account
3. Navigate to the B2 Cloud Storage dashboard

### 2. Create a Bucket

1. In the B2 dashboard, click "Create a Bucket"
2. Choose a unique bucket name (e.g., `tastebuddy-images-prod`)
3. Select **"Public"** bucket type (required for public image access)
4. Choose your preferred region (e.g., `us-west-004`)
5. Click "Create a Bucket"

### 3. Create Application Keys

1. Go to "App Keys" in the B2 dashboard
2. Click "Add a New Application Key"
3. Key Name: `TasteBuddy Production` (or similar)
4. Allow access to: Select your bucket
5. Type of Access: `Read and Write`
6. Click "Create New Key"
7. **Important**: Copy the `keyID` and `applicationKey` immediately (you won't see them again)

### 4. Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Backblaze B2 Configuration
B2_ENDPOINT="https://s3.us-west-004.backblazeb2.com"
B2_REGION="us-west-004"
B2_ACCESS_KEY_ID="your-key-id-from-step-3"
B2_SECRET_ACCESS_KEY="your-application-key-from-step-3"
B2_BUCKET_NAME="your-bucket-name-from-step-2"
B2_PUBLIC_URL="https://f004.backblazeb2.com/file/your-bucket-name"
```

**Note**: Replace the region codes (`004`) with your actual region code.

### 5. Find Your Public URL

1. In your bucket settings, look for "Endpoint" information
2. The public URL format is: `https://f{region-code}.backblazeb2.com/file/{bucket-name}`
3. Examples:
   - `us-west-004`: `https://f004.backblazeb2.com/file/your-bucket-name`
   - `eu-central-003`: `https://f003.backblazeb2.com/file/your-bucket-name`

## Testing the Setup

Once configured, you can test the B2 integration:

1. Start your development server: `npm run dev`
2. Try uploading an image through the recipe form
3. Check the console logs for B2 upload success messages
4. If B2 fails, the system will automatically fall back to local storage

## Bucket Configuration

### CORS Settings (if needed)

If you encounter CORS issues, add this configuration to your bucket:

```json
[
  {
    "corsRuleName": "TasteBuddy-uploads",
    "allowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "allowedMethods": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "allowedHeaders": [
      "*"
    ],
    "maxAgeSeconds": 3600
  }
]
```

### Lifecycle Rules (optional)

To automatically delete old images, you can set up lifecycle rules:

1. Go to bucket settings
2. Click "Lifecycle Rules"
3. Create rules to delete files older than X days

## Cost Optimization

- B2 charges for storage and bandwidth
- Enable CDN caching to reduce bandwidth costs
- Consider image compression to reduce storage costs
- Monitor usage in the B2 dashboard

## Troubleshooting

### Common Issues

1. **Upload fails with 401 error**
   - Check your access key ID and secret key
   - Ensure the keys have read/write access to the bucket

2. **Upload fails with 403 error**
   - Verify bucket permissions are set to "Public"
   - Check that your application key has access to the specific bucket

3. **Images don't load**
   - Verify the B2_PUBLIC_URL is correct
   - Check that the bucket is set to "Public"
   - Ensure the file was uploaded successfully

4. **Fallback to local storage**
   - Check the console logs for specific B2 error messages
   - Verify all environment variables are set correctly
   - Test B2 connectivity

### Debug Mode

To enable debug logging, add this to your environment:

```bash
DEBUG=b2:*
```

This will show detailed B2 API request/response information.

## Production Deployment

For production deployment:

1. Use a separate B2 bucket for production
2. Set up proper backup and monitoring
3. Consider using a CDN in front of B2 for better performance
4. Monitor costs and usage regularly

## Migration from Local Storage

If you have existing local images, you can migrate them:

1. Upload existing images to B2 manually or via script
2. Update database records to use B2 URLs
3. Remove local image files once migration is confirmed

The system supports both local and B2 URLs simultaneously, so migration can be gradual.