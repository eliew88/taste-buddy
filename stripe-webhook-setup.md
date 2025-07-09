# Stripe Webhook Setup for Development

## Using Stripe CLI (Recommended for Development)

1. **Install Stripe CLI**:
   ```bash
   # macOS with Homebrew
   brew install stripe/stripe-cli/stripe
   
   # Or download from https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local development**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook secret** (starts with `whsec_`) and add it to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

## Manual Webhook Setup (Alternative)

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `http://localhost:3000/api/webhooks/stripe`
4. Select events to send:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `capability.updated`
5. Add endpoint and copy the webhook secret

## Testing Webhooks

Once set up, webhooks will automatically update payment statuses in your database when:
- Payments succeed or fail
- Connect accounts are updated
- Capabilities change