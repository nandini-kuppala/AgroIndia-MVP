# 🚀 AgroIndia Deployment Guide

This guide will help you deploy your AgroIndia application for free using Render (backend) and Vercel (frontend).

## 📋 Prerequisites

1. GitHub account
2. MongoDB Atlas account (already set up ✓)
3. All API keys ready:
   - Gemini API Key
   - Google Cloud Project ID
   - MongoDB URI

---

## 🔧 Part 1: Deploy Backend to Render

### Step 1: Prepare Your Repository

1. Make sure all your code is committed to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

### Step 2: Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with GitHub

### Step 3: Create New Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select your `agro-india` repository

### Step 4: Configure Build Settings

- **Name:** `agroindia-backend` (or any name you prefer)
- **Region:** Oregon (or closest to you)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** Python 3
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 5: Add Environment Variables

Click "Advanced" and add these environment variables:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | Your Gemini API key |
| `GOOGLE_CLOUD_PROJECT` | `nurture-sync` |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `PYTHON_VERSION` | `3.11.0` |

### Step 6: Deploy

1. Click "Create Web Service"
2. Wait 5-10 minutes for the first build
3. You'll get a URL like: `https://agroindia-backend.onrender.com`
### Step 7: Test Your Backend

Visit: `
https://agroindia-mvp.onrender.com`

You should see:
```json
{
  "message": "AgroIndia Field Analysis API",
  "version": "1.0.0",
  "status": "running"
}
```

⚠️ **Important Note:** Free tier services sleep after 15 minutes of inactivity. First request may take 30-60 seconds to wake up.

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Create Production Environment File

Create `.env.production` in your root directory:

```bash
VITE_BACKEND_URL=
https://agroindia-mvp.onrender.com

```

Replace `your-backend-url` with your actual Render URL.

### Step 2: Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Sign up with GitHub

### Step 3: Import Project

1. Click "Add New..." → "Project"
2. Import your `agro-india` repository
3. Vercel will auto-detect it's a Vite project

### Step 4: Configure Build Settings

Vercel should auto-configure these, but verify:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 5: Add Environment Variables

In the "Environment Variables" section, add:

| Key | Value |
|-----|-------|
| `VITE_BACKEND_URL` | Your Render backend URL |
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

### Step 6: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes
3. You'll get a URL like: `https://agro-india.vercel.app`

### Step 7: Update CORS Settings

Update your backend's CORS settings in `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://agro-india.vercel.app"],  # Add your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then commit and push - Render will auto-deploy!

---

## 🎯 Alternative Free Deployment Options

### Backend Alternatives:
1. **Railway** (railway.app) - Similar to Render, free tier available
2. **Fly.io** (fly.io) - Good free tier, requires Docker
3. **Google Cloud Run** - Free tier, more complex setup

### Frontend Alternatives:
1. **Netlify** (netlify.com) - Similar to Vercel
2. **Cloudflare Pages** (pages.cloudflare.com) - Very fast CDN
3. **GitHub Pages** - Free but limited (static only)

---

## 📝 Post-Deployment Checklist

- [ ] Backend health check endpoint working
- [ ] Frontend loads correctly
- [ ] Can log in/sign up
- [ ] Can add fields
- [ ] Can run analysis
- [ ] Recent analysis displays on dashboard
- [ ] MongoDB data persists
- [ ] All API keys working
- [ ] CORS configured correctly

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Solution:**
- Check CORS settings in backend
- Verify `VITE_BACKEND_URL` is set correctly in Vercel
- Make sure backend is not sleeping (first request takes time)

### Issue: "Earth Engine authentication failed"
**Solution:**
- Make sure `GOOGLE_CLOUD_PROJECT` environment variable is set in Render
- Verify Earth Engine is enabled for your Google Cloud project

### Issue: "MongoDB connection timeout"
**Solution:**
- Add `0.0.0.0/0` to MongoDB Atlas Network Access (allows all IPs)
- Or add Render's outbound IP addresses

### Issue: "Backend is slow on first request"
**Solution:**
- This is normal on free tier - services sleep after 15 min inactivity
- Consider upgrading to paid tier ($7/month) for always-on service
- Or use a cron job to ping your backend every 10 minutes

---

## 💰 Cost Breakdown

### Current Setup (100% FREE):
- **MongoDB Atlas:** Free tier (512MB)
- **Render Backend:** Free tier (with sleep)
- **Vercel Frontend:** Free tier (unlimited bandwidth)
- **Total Cost:** $0/month

### Recommended Production Setup:
- **MongoDB Atlas:** Free tier (512MB) - $0
- **Render Backend:** Starter tier (no sleep) - $7/month
- **Vercel Frontend:** Free tier - $0
- **Total Cost:** $7/month

---

## 🔄 Continuous Deployment

Both Render and Vercel support auto-deployment:

1. Push code to GitHub
2. Both services automatically detect changes
3. Build and deploy within minutes
4. No manual steps needed!

**Enable auto-deploy:**
- Render: Enabled by default
- Vercel: Enabled by default for main branch

---

## 📞 Need Help?

If you run into issues:
1. Check the logs in Render/Vercel dashboard
2. Verify all environment variables are set
3. Test backend API endpoints directly
4. Check browser console for frontend errors

Good luck with your deployment! 🚀
