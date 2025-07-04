# Stripe Webhook Testing Guide

## 🎯 Current Setup Status
✅ Webhook endpoint: `POST /api/webhooks/stripe`
✅ Routing conflicts resolved (webhook moved from `/api/payments` to `/api/webhooks`)
✅ Metadata integration: `appointment_id` is now included in Stripe sessions
✅ Development testing endpoints added: `/api/dev/test-payment`

## 🔧 Stripe CLI Solutions

### Option 1: Manual Stripe CLI Setup
Since the WinGet installation didn't add Stripe CLI to PATH, try these solutions:

1. **Download manually:**
   ```
   https://github.com/stripe/stripe-cli/releases/latest
   Download: stripe_1.19.4_windows_x86_64.zip
   ```

2. **Extract and add to PATH:**
   - Extract to: `C:\stripe-cli\`
   - Add `C:\stripe-cli\` to your Windows PATH environment variable
   - Restart PowerShell/Command Prompt

3. **Test installation:**
   ```bash
   stripe --version
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### Option 2: Use npm package
```bash
npm install -g @stripe/stripe-cli
```

## 🧪 Testing Your Webhook System

### Method 1: Using Development Endpoint (Recommended for initial testing)
```bash
# Test payment creation
curl -X POST http://localhost:3000/api/dev/test-payment \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": 1, "amount": 75.00}'

# View all payments
curl http://localhost:3000/api/dev/payments
```

### Method 2: Using Stripe CLI (when working)
```bash
# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger checkout.session.completed
```

### Method 3: Using the Node.js test script
```bash
# Install dependencies first
npm install node-fetch

# Run the test
node test-webhook.js
```

## 🔍 Webhook URL Changes Made

**Before:** `/api/payments/webhook` (conflicted with payment routes)
**After:** `/api/webhooks/stripe` (dedicated webhook path)

**Full URL:** `http://localhost:3000/api/webhooks/stripe`

## 📋 Environment Variables Needed

Add these to your `.env` file:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🚀 Testing Payment Flow

1. **Create appointment** (via your appointment booking endpoint)
2. **Create payment session** (via `/api/payments/create-session`)
   - This now includes `appointment_id` in metadata
3. **Complete payment** (Stripe checkout)
4. **Webhook processes payment** (automatic)
5. **Verify in database** (via `/api/dev/payments`)

## 🐛 Debugging

Check console logs for:
- `🔍 Processing webhook for appointment: [ID]`
- `✅ Webhook payment logged: [ID]`
- `❌ Invalid appointment_id in webhook metadata`

## 🔗 API Endpoints Summary

- `POST /api/webhooks/stripe` - Stripe webhook handler
- `POST /api/dev/test-payment` - Development payment testing
- `GET /api/dev/payments` - View all payments
- `POST /api/payments/create-session` - Create Stripe checkout session
