export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('Instrumentation hook registered for analytics');
  }
}