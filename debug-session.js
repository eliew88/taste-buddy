// Test session in development
async function testSession() {
  try {
    console.log('Testing session...');
    
    // First, let's check what cookies are available
    const response = await fetch('http://localhost:3000/api/test-auth', {
      credentials: 'include'
    });
    
    const result = await response.json();
    console.log('Auth test result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Session test failed:', error);
  }
}

testSession();