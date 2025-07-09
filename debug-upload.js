const fs = require('fs');
const path = require('path');

// Create a small test image (1x1 PNG)
const testImageBuffer = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
  0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

async function testUpload() {
  try {
    // Create form data
    const formData = new FormData();
    const blob = new Blob([testImageBuffer], { type: 'image/png' });
    const file = new File([blob], 'test.png', { type: 'image/png' });
    formData.append('image', file);

    console.log('Testing upload with test PNG file...');
    
    const response = await fetch('http://localhost:3000/api/upload/recipe-image', {
      method: 'POST',
      body: formData,
      headers: {
        // Add any auth headers if needed
      }
    });

    const result = await response.json();
    
    console.log('Upload result:', JSON.stringify(result, null, 2));
    
    if (!result.success) {
      console.error('Upload failed:', result.error);
      if (result.debug) {
        console.log('Debug info:', JSON.stringify(result.debug, null, 2));
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUpload();