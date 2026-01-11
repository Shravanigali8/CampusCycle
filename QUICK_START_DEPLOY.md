# 🚀 Quick Start: Deploy to Render

## TL;DR - Fastest Path to Production

### 1. Get Your Information (30 min)
Follow `INFORMATION_NEEDED.md` to collect:
- Database connection string
- JWT secrets (generate)
- Email service credentials
- Image storage credentials

### 2. Create Services on Render (15 min)

#### A. Create Database
1. Render Dashboard → New → PostgreSQL
2. Name: `campuscycle-db`
3. Copy connection string

#### B. Create Backend
1. New → Web Service
2. Connect GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
4. Add ALL environment variables (see below)
5. Deploy

#### C. Create Frontend
1. New → Web Service
2. Connect GitHub repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variables (see below)
5. Deploy

### 3. Run Migrations (2 min)
1. Backend Service → Shell
2. Run: `npx prisma migrate deploy`
3. Run: `npm run prisma:seed`

### 4. Test (5 min)
1. Visit frontend URL
2. Register account
3. Check backend logs for email verification link
4. Login and test!

## 📋 Environment Variables

### Backend (Copy-Paste This)
```
DATABASE_URL=<from-render-postgres>
JWT_SECRET=<generate-with-node>
JWT_REFRESH_SECRET=<generate-with-node>
NODE_ENV=production
PORT=10000
FRONTEND_URL=<your-frontend-url>
APP_URL=<your-frontend-url>
RESEND_API_KEY=<from-resend>
SMTP_FROM=noreply@yourdomain.com
CLOUDINARY_CLOUD_NAME=<from-cloudinary>
CLOUDINARY_API_KEY=<from-cloudinary>
CLOUDINARY_API_SECRET=<from-cloudinary>
```

### Frontend (Copy-Paste This)
```
NEXT_PUBLIC_API_URL=<your-backend-url>
NEXT_PUBLIC_SOCKET_URL=<your-backend-url>
NODE_ENV=production
```

## 🎯 That's It!

Your app will be live at: `https://your-frontend-url.onrender.com`

For detailed instructions, see `RENDER_DEPLOYMENT.md`

