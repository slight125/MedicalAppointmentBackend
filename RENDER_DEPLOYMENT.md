# 🚀 Render Deployment Guide

## Prerequisites
- GitHub account with your backend code pushed
- Render account (free tier available)
- PostgreSQL database (Render provides this)

## Step 1: Prepare Your Repository

Make sure your backend code is pushed to GitHub with the following structure:
```
Backend/
├── src/
├── package.json
├── tsconfig.json
└── drizzle.config.ts
```

## Step 2: Create a Web Service on Render

1. **Go to [Render.com](https://render.com)** and sign up/log in
2. Click **"New +"** → **"Web Service"**
3. **Connect your GitHub account** if you haven't already
4. **Select your repository** (the one containing your backend code)
5. **Configure the service:**

### Basic Settings:
- **Name:** `medical-appointment-backend` (or your preferred name)
- **Region:** Choose closest to your users
- **Branch:** `main` (or your deployment branch)
- **Root Directory:** `Backend` (since your backend is in a subdirectory)
- **Environment:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

### Environment Variables:
Click **"Advanced"** → **"Add Environment Variable"** and add:

#### Required Variables:
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=10000
```

#### Optional Variables (for full functionality):
```
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
DARAJA_CONSUMER_KEY=your_mpesa_consumer_key
DARAJA_CONSUMER_SECRET=your_mpesa_consumer_secret
DARAJA_SHORT_CODE=your_mpesa_shortcode
DARAJA_PASSKEY=your_mpesa_passkey
DARAJA_CALLBACK_URL=https://your-app.onrender.com/api/mpesa/callback
```

## Step 3: Set Up PostgreSQL Database

1. **Create a PostgreSQL service:**
   - Click **"New +"** → **"PostgreSQL"**
   - Choose a name like `medical-appointment-db`
   - Select the same region as your web service
   - Choose a plan (free tier available)

2. **Get the connection string:**
   - Go to your PostgreSQL service dashboard
   - Copy the **"External Database URL"**
   - Set this as your `DATABASE_URL` environment variable

3. **Run database migrations:**
   - In your web service settings, add a **"Build Command"** that includes migrations:
   ```
   npm install && npm run build && npm run migrate
   ```

## Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your app
3. You'll get a URL like: `https://medical-appointment-backend.onrender.com`

## Step 5: Test Your Deployment

1. **Test the health check:**
   ```
   GET https://your-app.onrender.com/
   ```
   Should return: `🏥 Medical Appointment API is alive!`

2. **Test a public endpoint:**
   ```
   GET https://your-app.onrender.com/api/test-public
   ```

3. **Test database connection:**
   ```
   GET https://your-app.onrender.com/api/auth/register
   ```
   (This will test if your database is connected)

## Step 6: Update Frontend

In your frontend (Vercel), update the API URL:
```javascript
// In your frontend environment variables
VITE_API_URL=https://your-app.onrender.com/api
```

## Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check the build logs in Render dashboard
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation passes locally

2. **Database Connection Fails:**
   - Verify `DATABASE_URL` is correct
   - Check if PostgreSQL service is running
   - Ensure migrations have been run

3. **Environment Variables Missing:**
   - Double-check all required env vars are set
   - Restart the service after adding new variables

4. **CORS Issues:**
   - Your backend already has CORS configured
   - If issues persist, check your frontend domain

### Useful Commands:

```bash
# Check build locally
npm run build

# Test locally
npm start

# Run migrations locally
npm run migrate

# Seed database locally
npm run seed
```

## Monitoring

- **Logs:** View real-time logs in Render dashboard
- **Metrics:** Monitor CPU, memory, and response times
- **Health Checks:** Render automatically checks your app's health

## Scaling

- **Free Tier:** 750 hours/month, sleeps after 15 minutes of inactivity
- **Paid Plans:** Always-on, better performance, custom domains

## Security

- **HTTPS:** Automatically enabled
- **Environment Variables:** Encrypted and secure
- **Database:** Isolated and secure

## Support

- **Render Docs:** https://render.com/docs
- **Community:** https://community.render.com
- **Status:** https://status.render.com

---

## Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created
- [ ] Environment variables set
- [ ] Build command configured
- [ ] Start command configured
- [ ] Service deployed successfully
- [ ] Health check passes
- [ ] Frontend API URL updated
- [ ] Database migrations run
- [ ] App tested end-to-end

🎉 **Your Medical Appointment System is now live on Render!** 