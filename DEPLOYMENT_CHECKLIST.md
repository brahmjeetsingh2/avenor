# 🚀 Deployment Checklist — Avenor

**Current State**: ✅ All checks passed. Ready for production.

---

## Part 1: Backend Deployment (Render)

### Step 1.1: Push to GitHub
```bash
cd /Users/brahmjeetsingh/Downloads/avenor
git status
git add .
git commit -m "Deploy: remove security advisories, fix env docs"
git push -u origin main
```

Note: `server/.env` is ignored by Git and should stay local. Put secrets only in Render/Vercel environment variables.

### Step 1.2: Create Render Web Service
1. Go to [render.com](https://render.com)
2. Connect your GitHub account
3. Click **New Web Service**
4. Select repository: `avenor`
5. Fill in:
   - **Name**: `avenor-api`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Region**: Singapore (closest to India)
   - **Plan**: Free

### Step 1.3: Set Environment Variables in Render Dashboard
Copy-paste these keys and fill in your values:

```
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/avenor?retryWrites=true&w=majority
JWT_ACCESS_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_REFRESH_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
REDIS_URL=rediss://<upstash-redis-url>
CLIENT_URL=https://avenor.vercel.app
EMAIL_USER=<your-gmail>
EMAIL_PASS=<gmail-app-password>
GROQ_API_KEY=<from console.groq.com>
GOOGLE_CLIENT_ID=<from console.cloud.google.com>
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_CALLBACK_URL=https://<your-render-domain>.onrender.com/api/auth/google/callback
ATLAS_SEARCH_ENABLED=true
```

### Step 1.3.1: Configure Google OAuth
In Google Cloud Console → APIs & Services → Credentials, add these exact values:
- Authorized JavaScript origin: `https://avenor.vercel.app`
- Authorized redirect URI: `https://<your-render-domain>.onrender.com/api/auth/google/callback`

Important: the redirect URI must match exactly, including `https`, domain, path, and no trailing slash.

### Step 1.4: Deploy Backend
Click **Deploy** on Render. Wait for build to complete (~2 min).

### Step 1.5: Verify Backend
```bash
curl https://<your-render-domain>.onrender.com/api/health
```
Expected response:
```json
{
  "success": true,
  "message": "Avenor API 🚀",
  "env": "production",
  "ts": "2026-04-09T..."
```

---

## Part 2: Frontend Deployment (Vercel)

### Step 2.1: Set Frontend Environment Variable
Add `VITE_API_URL` to Vercel project settings:
```
VITE_API_URL=https://<your-render-domain>.onrender.com/api
```

### Step 2.2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo: `avenor`
3. Fill in:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Install Command**: `npm install`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**

### Step 2.3: Set Environment Variable in Vercel
After deploy, go to **Settings → Environment Variables**:
- Add `VITE_API_URL=https://<your-render-domain>.onrender.com/api`
- Redeploy to apply

### Step 2.4: Verify Frontend
Navigate to your Vercel URL (e.g., `https://avenor.vercel.app`). You should see the login page.

---

## Part 3: Post-Deployment Verification

### 3.1: Test API Connectivity
```bash
# From your frontend, open browser DevTools → Network tab
# Try logging in → should see XHR requests to your Render backend
```

### 3.2: Test Real-time Features
1. Open app in two browser tabs
2. Login in one tab as Student
3. Login in other tab as Coordinator
4. Post a company announcement from Coordinator
5. Verify notifications appear in Student tab in real-time (Socket.io)

### 3.3: Test AI Feature
1. Login as Student
2. Go to **AI Interview Prep**
3. Select a company and role
4. Verify AI response streams back

---

## Part 4: Enable Uptime (Optional but Recommended)

Render free tier sleeps after 15min inactivity. To prevent cold starts:

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create monitor:
   - **URL**: `https://<your-render-domain>.onrender.com/api/health`
   - **Interval**: 5 minutes
3. Saves about $7/month on Render compute

---

## Rollback Plan

If something breaks in production:

```bash
# Render: Redeploy previous commit
git revert <commit-hash>
git push origin main
# Render will auto-redeploy

# Vercel: Same process
```

---

## Success Criteria

- [ ] Backend health check returns 200
- [ ] Frontend loads without 5xx errors
- [ ] Login works (JWT validation)
- [ ] Socket.io connection established (check DevTools: WebSocket)
- [ ] AI prep generates response
- [ ] Database queries return data (companies, experiences)

---

**Deployment Date**: 9 April 2026  
**Status**: Ready for Production ✅