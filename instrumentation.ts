export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run in production
    if (process.env.VERCEL_ENV === 'production') {
      const { inject } = await import('@vercel/analytics/server');
      inject();
    }
  }
}