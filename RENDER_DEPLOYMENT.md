# Deploy Backend to Render.com — Step-by-Step

## Overview
You'll deploy:
1. **PostgreSQL Database** on Render (free tier)
2. **Node.js Backend** on Render (free tier with auto-sleep)

---

## Step 1: Create Render Account
1. Go to https://render.com
2. Sign up (free) — use GitHub to sign in for faster setup
3. Click **"New"** → **"PostgreSQL"**

## Step 2: Create PostgreSQL Database

### Create Database
1. **Name:** `dllc-hr-db`
2. **Database:** `dllc_hr`
3. **User:** `postgres`
4. **Region:** Choose closest to you (e.g., `Oregon` for US)
5. **Plan:** Free (IPV4 available)
6. Click **"Create Database"**

### Wait for Database Ready
- This takes ~2 minutes
- Once ready, you'll see the **External Database URL** (looks like: `postgresql://user:pass@host:5432/dllc_hr`)
- **Copy and save this URL** — you'll need it for the backend

### Initialize Database Schema
Once your database is ready:

```bash
# From your local machine (in the backend folder):
cd backend

# Set the Render database URL temporarily to initialize schema
$env:DATABASE_URL = "postgresql://user:password@your-render-host:5432/dllc_hr"

# Run the schema setup
node setup-db.js

# Then load demo users
# (You can do this via API once backend is deployed, or via curl)
```

---

## Step 3: Deploy Node.js Backend

### Create Web Service
1. Go to https://render.com/dashboard
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository:
   - Click **"Connect account"** if prompted
   - Select repository: `Internal-HR-Application-DLLC`
   - Branch: `main`
4. Fill in deployment details:
   - **Name:** `dllc-hr-api`
   - **Root Directory:** `backend` (important!)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
   - **Region:** Same as database
5. Click **"Create Web Service"**

---

## Step 4: Set Environment Variables

### Add Environment Variables
1. On the Web Service page, go to **"Environment"** tab
2. Add these variables:

```
DATABASE_URL = postgresql://user:password@your-render-host:5432/dllc_hr
JWT_SECRET = your-secret-key-change-in-production
NODE_ENV = production
PORT = 3000
CORS_ORIGINS = https://hr-application-dllc.netlify.app
```

**Replace with your actual values:**
- `DATABASE_URL` — from Step 2
- `JWT_SECRET` — use a strong random string
- `CORS_ORIGINS` — your Netlify URL

3. Click **"Save"**

---

## Step 5: Deploy & Monitor

### Deployment
- Render automatically deploys when you push to GitHub
- Go to **"Logs"** tab to watch deployment
- **Wait ~5 minutes** for first deployment

### Check Deployment Status
```
# You should see:
✓ Build successful
✓ Server running on port 3000
✓ Database connected successfully
```

### Get Your Backend URL
Once deployed, Render shows your API URL:
- Format: `https://dllc-hr-api.onrender.com`
- Copy this — you'll use it on Netlify

### Test Backend Health
```bash
curl https://dllc-hr-api.onrender.com/api/health

# You should see:
{"status":"ok","timestamp":"2026-02-20T..."}
```

---

## Step 6: Seed Demo Users

### Option A: Via curl (one-time)
```bash
curl -X POST https://dllc-hr-api.onrender.com/api/demo/load-users

# You should see:
{"success":true,"created_count":10,"message":"Demo users are ready..."}
```

### Option B: Via Netlify after linking
- Once frontend is linked to backend, click the "Load / Repair Demo Users" button on the login page

---

## Step 7: Link Netlify to Backend

1. Go to **Netlify → Site settings → Environment → Edit variables**
2. Add/update:
   ```
   REACT_APP_BACKEND_URL = https://dllc-hr-api.onrender.com
   ```
3. **Netlify redeploys automatically**

---

## Step 8: Test Full Application

1. Go to **https://hr-application-dllc.netlify.app**
2. You should see the **login page** (no more 404)
3. Click **"Load / Repair Demo Users"** button
4. Login with demo credentials:
   - Email: `admin@dllc.com`
   - Password: `demo123`
5. You should see the **Dashboard** ✅

---

## Troubleshooting

### **Backend shows 500 or no logs**
- Check **Render Logs** tab
- Verify `DATABASE_URL` is set correctly
- Run `node setup-db.js` locally to initialize schema first

### **Frontend shows 404 after Netlify update**
- Wait 2 minutes for Netlify rebuild
- Clear browser cache (Ctrl+Shift+Delete)
- Check browser DevTools → Network for 404s

### **Login fails "Invalid credentials"**
- Make sure demo users are loaded (click button on login page)
- Check backend logs: POST `/api/demo/load-users` status
- Verify `CORS_ORIGINS` matches your Netlify URL

### **Render auto-sleeps (free tier)**
- Free tier spins down after 15 min inactivity
- First request takes ~30 sec to wake up
- Upgrade to paid tier to remove auto-sleep

---

## Important Notes

💡 **Free Tier Limits:**
- Render PostgreSQL: 256 MB storage (sufficient for demo)
- Render Web Service: Auto-sleeps after 15 min inactivity
- Netlify: Unlimited bandwidth & requests

⚠️ **Production Readiness:**
- Change `JWT_SECRET` to a strong random value
- Enable SSL/TLS (Render does this by default)
- Use environment variable management (done ✓)
- Set up monitoring & alerts

---

**Once complete, reply with:**
- Your backend URL from Render
- Any errors from Render logs
- Confirmation that login works with `admin@dllc.com / demo123`
