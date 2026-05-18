# Quick Deployment Commands

## 1. Initialize Git Repository (if not already done)
```bash
cd D:\ptis-lms
git init
git add .
git commit -m "Initial commit for deployment"
```

## 2. Create GitHub Repository
```bash
# Go to github.com and create a new repository named 'ptis-lms'
# Then run:
git remote add origin https://github.com/YOUR_USERNAME/ptis-lms.git
git branch -M main
git push -u origin main
```

## 3. Deploy Order

### Step 1: Database (Railway)
1. Sign up at https://railway.app
2. New Project → Provision MySQL
3. Copy connection details

### Step 2: Backend (Render)
1. Sign up at https://render.com
2. New Web Service → Connect GitHub repo
3. Root Directory: `backend/ptis-api`
4. Build: `npm install`
5. Start: `node server.js`
6. Add environment variables from Railway
7. If you need Cambria on Windows, add:
   - `PTIS_CAMBRIA_HEADINGS_FONT_PATH` = `C:/Windows/Fonts/cambriab.ttf`
   - `PTIS_CAMBRIA_FONT_PATH` = `C:/Windows/Fonts/cambria.ttf`
8. Deploy and copy URL

### Step 3: Frontend (Vercel)
1. Sign up at https://vercel.com
2. Import GitHub repository
3. Root Directory: `frontend`
4. Framework: Create React App
5. Add environment variable:
   - `REACT_APP_API_URL` = your Render backend URL
6. Deploy

### Step 4: Update Backend CORS
- Add `FRONTEND_URL` environment variable in Render
- Value: your Vercel frontend URL
- Backend will auto-redeploy

## Done! 🎉

Your application is now live:
- Frontend: https://your-app.vercel.app
- Backend: https://your-api.onrender.com

## Important: First-Time Setup
After deployment, you need to:
1. Import your database schema to Railway MySQL
2. Import your data (employees, questions, standards)
3. Test all functionality

## Free Tier Limits
- Render: Sleeps after 15min inactivity (30-60s wake time)
- Railway: 500 hours/month database
- Vercel: Unlimited deployments

Read DEPLOYMENT_GUIDE.md for full details!
