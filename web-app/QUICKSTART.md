# 🚀 Quick Start Guide - Get Running in 5 Minutes

## Step 1: Install Dependencies (2 minutes)

```bash
npm install
```

This installs React, Vite, and other dependencies.

## Step 2: Configure Backend URL (1 minute)

```bash
# Copy environment template
cp .env.example .env

# Edit .env - set your backend URL
# Default: VITE_API_URL=http://localhost:3000/api/v1
```

If your backend runs on a different port, update this URL.

## Step 3: Start the App (1 minute)

```bash
npm run dev
```

App opens at: **http://localhost:3001**

## Step 4: Test It (1 minute)

1. Open http://localhost:3001
2. Click "Sign Up"
3. Create a test account
4. You should see the dashboard!

---

## ✅ Success Checklist

- [ ] Backend is running (check http://localhost:3000)
- [ ] `npm install` completed without errors
- [ ] `.env` file exists with correct API URL
- [ ] `npm run dev` started successfully
- [ ] Can open http://localhost:3001 in browser
- [ ] Can create account and login

---

## 🐛 Quick Fixes

### Can't connect to backend?

```bash
# Check backend is running
cd ../backend
npm run dev

# Should see: "Server running on port 3000"
```

### Port 3001 already in use?

Edit `vite.config.ts`:
```typescript
server: {
  port: 3002,  // Change to any available port
}
```

### Still having issues?

1. Check browser console (F12)
2. Check terminal for errors
3. Read full README.md

---

## 📦 Deploy to Vercel (Production)

```bash
# Install Vercel
npm i -g vercel

# Login
vercel login

# Deploy (follow prompts)
vercel

# Add environment variable in Vercel dashboard:
# VITE_API_URL = your-production-backend-url
```

Done! Your app is live at: `https://your-app.vercel.app`
