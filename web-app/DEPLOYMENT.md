# 🌐 GraceFlow Web App - Deployment Guide

## Quick Deploy Options (Easiest First)

### 1. Vercel (Recommended - Takes 5 minutes)

**Why Vercel:**
- ✅ Free hosting
- ✅ Automatic HTTPS
- ✅ One-command deploy
- ✅ Auto-deploy from Git

**Steps:**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
cd graceflow-web
vercel
```

**Set Environment Variable:**
1. Go to Vercel dashboard
2. Select your project
3. Settings → Environment Variables
4. Add: `VITE_API_URL` = `https://your-backend-api.com/api/v1`
5. Redeploy

Your app is live at: `https://graceflow-web-xxx.vercel.app`

---

### 2. Netlify (Also Free & Easy)

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Build
npm run build

# Deploy
netlify deploy --prod

# Set environment variable
netlify env:set VITE_API_URL https://your-backend-api.com/api/v1
```

---

### 3. GitHub Pages (Free, Static Only)

**Setup:**

1. Create repo on GitHub
2. Push your code
3. Enable GitHub Pages in repo settings

**Deploy:**

```bash
# Install gh-pages
npm i -D gh-pages

# Add to package.json scripts:
"deploy": "vite build && gh-pages -d dist"

# Deploy
npm run deploy
```

Your app: `https://yourusername.github.io/graceflow-web`

---

### 4. Your Own Server (VPS/Dedicated)

**Requirements:**
- Linux server (Ubuntu recommended)
- Node.js installed
- Nginx or Apache
- Domain name (optional)

**Steps:**

```bash
# 1. Build locally
npm run build

# 2. Copy dist/ folder to server
scp -r dist/* user@your-server.com:/var/www/graceflow

# 3. Configure Nginx
sudo nano /etc/nginx/sites-available/graceflow

# Add:
server {
    listen 80;
    server_name graceflow.yourdomain.com;
    root /var/www/graceflow;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 4. Enable site
sudo ln -s /etc/nginx/sites-available/graceflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 5. Setup HTTPS (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d graceflow.yourdomain.com
```

---

## Backend Deployment

Your web app needs a deployed backend. Options:

### Railway (Easiest for Backend)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# In your backend folder
cd backend
railway init
railway up

# Get your backend URL from Railway dashboard
# Use it in VITE_API_URL
```

### Heroku

```bash
# Install Heroku CLI
npm i -g heroku

# In backend folder
cd backend
heroku create graceflow-api
git push heroku main

# Get URL: https://graceflow-api.herokuapp.com
```

### Render.com

1. Connect GitHub repo
2. Create "Web Service"
3. Select backend folder
4. Deploy

---

## Environment Variables for Production

Update `.env` or deployment platform settings:

```env
# Production Backend URL
VITE_API_URL=https://api.graceflow.com/api/v1
```

---

## CORS Configuration (Important!)

Your backend must allow requests from your web app domain.

**Express.js backend:**

```javascript
// backend/src/index.ts
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:3001',           // Development
    'https://graceflow-web.vercel.app', // Production
    'https://graceflow.yourdomain.com' // Custom domain
  ],
  credentials: true
}));
```

---

## Custom Domain Setup

### Vercel
1. Go to project settings
2. Domains → Add
3. Enter your domain (e.g., app.graceflow.com)
4. Follow DNS instructions

### Netlify
1. Domain settings → Add custom domain
2. Update DNS records
3. Netlify handles HTTPS automatically

---

## Monitoring & Analytics

### Add Google Analytics

Add to `index.html` (before `</head>`):

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking (Sentry)

```bash
npm i @sentry/react

# Add to GraceFlowWebApp.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

---

## Performance Optimization

### 1. Enable Compression

**Vite** (automatic in production build)

### 2. CDN Configuration

Use Cloudflare for:
- Caching static assets
- DDoS protection
- Global CDN

### 3. Bundle Size Optimization

Check bundle size:
```bash
npm run build -- --report
```

---

## Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] No sensitive data in code
- [ ] API rate limiting enabled
- [ ] Backend authentication working
- [ ] Content Security Policy headers

---

## Post-Deployment Testing

1. **Login Flow**
   - Can users register?
   - Can users login?
   - Do tokens persist?

2. **Core Features**
   - Add glucose reading
   - Log symptom
   - Start cycle tracking

3. **Mobile Responsiveness**
   - Test on actual phone
   - Test on tablet

4. **Performance**
   - Page load time < 3 seconds
   - No console errors

---

## Rollback Plan

If deployment fails:

### Vercel/Netlify
- Go to deployments
- Select previous working deployment
- Click "Rollback"

### Manual Server
```bash
# Keep backups
cp -r /var/www/graceflow /var/www/graceflow-backup-$(date +%Y%m%d)

# Rollback
cp -r /var/www/graceflow-backup-YYYYMMDD /var/www/graceflow
sudo systemctl reload nginx
```

---

## Maintenance

### Regular Updates

```bash
# Update dependencies
npm update

# Rebuild
npm run build

# Redeploy
vercel --prod  # or your deployment method
```

### Monitor Logs

**Vercel:** Dashboard → Functions → View Logs
**Netlify:** Deploys → View Logs
**Own Server:** `sudo tail -f /var/log/nginx/access.log`

---

## Cost Estimates

| Platform | Cost | Best For |
|----------|------|----------|
| Vercel | $0-20/mo | Most users |
| Netlify | $0-19/mo | Alternative to Vercel |
| GitHub Pages | Free | Simple static hosting |
| Railway | $5-20/mo | Backend hosting |
| Own VPS | $5-100/mo | Full control |

---

## Support

**Deployment Issues:**
- Check deployment logs
- Verify environment variables
- Test backend separately

**Need Help?**
- Email: alexiavalen304@gmail.com
- Check TROUBLESHOOTING.md

---

**Remember:** Always test on staging before production!
