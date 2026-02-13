# PTIS LMS Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free)
- Render account (free)
- Railway account (free) OR use Render for database

---

## Step 1: Prepare Your Code

### 1.1 Create .gitignore (if not exists)
```
node_modules/
.env
.venv/
__pycache__/
*.pyc
.DS_Store
build/
dist/
```

### 1.2 Update Backend CORS
In `backend/ptis-api/server.js`, update CORS configuration:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-url.vercel.app'  // Add after deploying frontend
  ],
  credentials: true
}));
```

### 1.3 Create Environment Variables File
Copy `.env.example` to `.env` and fill in your values.

---

## Step 2: Deploy Database (Railway - Recommended)

### Option A: Railway MySQL (Free 500 hours/month)

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Provision MySQL"
4. Once created, click on MySQL service
5. Go to "Connect" tab
6. Copy these values:
   - `MYSQL_HOST`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

7. Connect to your database and import your schema:
   - Use MySQL Workbench or command line
   - Import your tables: `employees`, `questions`, `standard`, `result`, `info`

### Option B: Render PostgreSQL (Free)
If you prefer PostgreSQL, you can use Render's free PostgreSQL database and migrate your MySQL schema.

---

## Step 3: Deploy Backend (Render)

1. Push your code to GitHub first:
```bash
cd D:\ptis-lms
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ptis-lms.git
git push -u origin main
```

2. Go to [render.com](https://render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `ptis-backend`
   - **Root Directory**: `backend/ptis-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

6. Add Environment Variables:
   - `DB_HOST` = (from Railway)
   - `DB_USER` = (from Railway)
   - `DB_PASSWORD` = (from Railway)
   - `DB_NAME` = `ptis_testing`
   - `PORT` = `3001`
   - `NODE_ENV` = `production`

7. Click "Create Web Service"
8. Wait for deployment (5-10 minutes)
9. Copy your backend URL: `https://ptis-backend.onrender.com`

---

## Step 4: Update Frontend API URL

In `frontend/src/shared/api.js`, update the API base URL:

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ptis-backend.onrender.com'  // Your Render backend URL
  : 'http://localhost:3001';
```

---

## Step 5: Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

5. Add Environment Variable (if needed):
   - `REACT_APP_API_URL` = `https://ptis-backend.onrender.com`

6. Click "Deploy"
7. Wait for deployment (2-5 minutes)
8. Copy your frontend URL: `https://ptis-lms.vercel.app`

---

## Step 6: Update Backend CORS

Go back to Render dashboard:
1. Select your backend service
2. Go to "Environment"
3. Add new environment variable:
   - `FRONTEND_URL` = `https://ptis-lms.vercel.app`

4. Update `server.js` to use this:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'https://ptis-lms.vercel.app'
  ],
  credentials: true
}));
```

5. Redeploy the backend (it will auto-deploy if connected to GitHub)

---

## Step 7: Test Your Deployment

1. Visit your frontend URL: `https://ptis-lms.vercel.app`
2. Try logging in as admin
3. Test all features:
   - Dashboard
   - Employee management
   - Standards management
   - Questions management
   - Test results
   - Certificates

---

## Alternative: Deploy Everything on Render

If you prefer a single platform:

1. **Database**: Render PostgreSQL (free)
2. **Backend**: Render Web Service (free)
3. **Frontend**: Render Static Site (free)

---

## Important Notes

### Free Tier Limitations:
- **Render**: Services sleep after 15 minutes of inactivity (takes 30-60s to wake up)
- **Railway**: 500 hours/month database uptime
- **Vercel**: Unlimited deployments, bandwidth limits apply

### Production Checklist:
- [ ] Update all API URLs
- [ ] Configure CORS properly
- [ ] Set up environment variables
- [ ] Import database schema and data
- [ ] Test all features
- [ ] Set up custom domain (optional)
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Monitor usage to stay within free tiers

---

## Custom Domain (Optional)

### For Frontend (Vercel):
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### For Backend (Render):
1. Go to Service Settings → Custom Domains
2. Add your custom domain
3. Update DNS records as instructed

---

## Troubleshooting

### Backend won't start:
- Check environment variables are set correctly
- Check logs in Render dashboard
- Verify database connection strings

### Frontend can't connect to backend:
- Check CORS configuration
- Verify API_BASE_URL is correct
- Check browser console for errors

### Database connection fails:
- Verify credentials
- Check if database is running
- Ensure IP whitelist includes 0.0.0.0/0 (Railway)

---

## Cost Estimate (Free Tier)

| Service | Free Tier | Cost After Free |
|---------|-----------|-----------------|
| Vercel | Unlimited | $20/month |
| Render | 750 hours/month | $7/month per service |
| Railway | 500 hours/month | $0.000463/minute |

**Total: $0/month** (within free tier limits)

---

## Next Steps After Deployment

1. Set up monitoring (Render provides basic metrics)
2. Configure automated backups for database
3. Set up CI/CD pipeline (automatic on Vercel/Render)
4. Add analytics (Google Analytics, etc.)
5. Set up error tracking (Sentry, LogRocket)
