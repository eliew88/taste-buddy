# Recipe Images Setup Guide

This guide explains how to add images to your recipes for the 4-panel hero background.

## Quick Setup

### 1. Add Sample Images to Database
Run this script to add sample image paths to your existing recipes:

```bash
node scripts/add-recipe-images.js
```

### 2. Add Actual Images
Place your recipe images in the public folder:

```
public/images/recipes/
├── pasta-carbonara.jpg
├── chicken-tikka-masala.jpg
├── beef-tacos.jpg
├── vegetable-stir-fry.jpg
├── chocolate-cake.jpg
├── salmon-teriyaki.jpg
├── mushroom-risotto.jpg
├── greek-salad.jpg
├── banana-bread.jpg
└── thai-curry.jpg
```

### 3. Image Requirements
- **Format**: JPG, PNG, or WebP
- **Size**: Recommended minimum 800x600 pixels
- **Aspect Ratio**: 16:9 or 4:3 work best
- **File Size**: Keep under 500KB for fast loading

## How It Works

1. **Database Query**: The homepage fetches recipes with `?featured=true&limit=4`
2. **Image Filter**: Only recipes with the `image` field are used
3. **Fallback**: If fewer than 4 recipes have images, Unsplash fallbacks are used
4. **Display**: Images are shown in a 2x2 grid with hover effects

## Adding Images to New Recipes

### Option 1: Through Database (Recommended)
Update recipes directly in your database:

```sql
UPDATE Recipe 
SET image = '/images/recipes/your-image.jpg' 
WHERE id = 'your-recipe-id';
```

### Option 2: Through Recipe Form
Add an image upload field to your recipe creation form (future enhancement).

### Option 3: External URLs
You can also use external image URLs:

```sql
UPDATE Recipe 
SET image = 'https://example.com/your-image.jpg' 
WHERE id = 'your-recipe-id';
```

## Troubleshooting

### Hero Shows Fallback Images
- Check if you have recipes with images: `SELECT * FROM Recipe WHERE image IS NOT NULL;`
- Run the add-images script: `node scripts/add-recipe-images.js`
- Ensure image files exist in `public/images/recipes/`

### Images Don't Load
- Check file paths are correct (start with `/images/recipes/`)
- Verify images exist in the public folder
- Check browser console for 404 errors

### Poor Image Quality
- Use high-resolution images (minimum 800x600)
- Optimize images for web (compress without losing quality)
- Consider using WebP format for better compression

## Pro Tips

1. **Use Food Photography**: High-quality, well-lit food photos work best
2. **Consistent Style**: Try to maintain a consistent photography style
3. **Optimize for Web**: Compress images to reduce load times
4. **Test Locally**: Always test images work locally before deploying
5. **Backup**: Keep original high-resolution images as backups

## Future Enhancements

- Add image upload functionality to recipe forms
- Implement image optimization and resizing
- Add image alt text for accessibility
- Create image management dashboard