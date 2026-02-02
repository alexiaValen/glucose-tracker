# 🌿 GraceFlow Web Application

A fully functional web version of your GraceFlow mobile app. Users can login, signup, and log glucose/symptoms while waiting for App Store approval.

## ✨ Features

- ✅ **User Authentication** - Login & Registration
- ✅ **Glucose Tracking** - Add and view glucose readings
- ✅ **Symptom Logging** - Track symptoms with severity ratings
- ✅ **Cycle Tracking** - Start and monitor menstrual cycle
- ✅ **Dashboard** - Overview of all health data
- ✅ **Beautiful UI** - Matches your mobile app's aesthetic

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Your backend API running (from the main GraceFlow project)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Edit .env with your backend URL
# VITE_API_URL=http://localhost:3000/api/v1

# 4. Start development server
npm run dev
```

The app will open at `http://localhost:3001`

## 📁 Project Structure

```
graceflow-web/
├── index.html                      # Main HTML file
├── src/
│   ├── main.tsx                    # Entry point
│   └── GraceFlowWebApp.tsx        # Complete application (single file)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🎯 How It Works

### Single-File Architecture

The entire web app is in **one file** (`GraceFlowWebApp.tsx`) for easy deployment and maintenance:

- **API Service** - Handles all backend communication
- **State Management** - React Context for global state
- **Components** - Login, Register, Dashboard, and feature views
- **Styling** - Inline styles matching mobile app aesthetic

### API Integration

The app connects to your existing Express.js backend:

```typescript
// Endpoints used:
POST /api/v1/auth/login
POST /api/v1/auth/register
GET  /api/v1/glucose
POST /api/v1/glucose
GET  /api/v1/symptoms
POST /api/v1/symptoms
GET  /api/v1/cycles/current
POST /api/v1/cycles
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
# Development
VITE_API_URL=http://localhost:3000/api/v1

# Production (example)
VITE_API_URL=https://api.graceflow.com/api/v1
```

### Backend Requirements

Your backend must:
1. Accept requests from web origin (CORS configured)
2. Return JWT tokens on login/register
3. Support all the endpoints listed above

### CORS Setup

Add to your Express backend:

```javascript
// backend/src/index.ts or server.ts
import cors from 'cors';

app.use(cors({
  origin: ['http://localhost:3001', 'https://your-domain.com'],
  credentials: true
}));
```

## 📦 Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

This creates a `dist/` folder with static files ready to deploy.

## 🌐 Deployment Options

### Option 1: Vercel (Recommended - Free)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### Option 3: GitHub Pages

```bash
# Build
npm run build

# Deploy dist/ folder to gh-pages branch
```

### Option 4: Your Own Server

```bash
# Build
npm run build

# Copy dist/ folder to your web server
scp -r dist/* user@your-server.com:/var/www/html/
```

## 🔐 Security Notes

1. **HTTPS Required in Production** - Always use HTTPS for production
2. **Environment Variables** - Never commit `.env` file
3. **API URL** - Update `VITE_API_URL` for production backend
4. **CORS** - Configure backend to only accept requests from your domain

## 🎨 Customization

### Colors

Colors are defined in the `styles` object. Main colors:

```javascript
Primary: '#6B7F6E'   // Sage green
Secondary: '#3D5540' // Forest green
Accent: '#B8A45F'    // Gold
Background: '#F5F4F0' // Cream
```

### Typography

Using Inter font family (loaded from Google Fonts in `index.html`)

### Layout

- Max width: 1200px for dashboard
- Mobile responsive (automatically adapts)
- Card-based design

## 🐛 Troubleshooting

### "Failed to fetch" Error

**Problem:** Can't connect to backend
**Solution:** 
1. Verify backend is running (`npm run dev` in backend folder)
2. Check `VITE_API_URL` in `.env`
3. Ensure CORS is configured in backend

### Login Not Working

**Problem:** Authentication fails
**Solution:**
1. Check backend `/auth/login` endpoint
2. Verify JWT tokens are being returned
3. Check browser console for errors

### Blank Page After Login

**Problem:** Data not loading
**Solution:**
1. Check backend API endpoints are working
2. Open browser DevTools → Network tab
3. Verify API requests are successful (200 status)

### Styles Look Wrong

**Problem:** CSS not loading
**Solution:**
1. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
2. Clear browser cache
3. Check browser console for errors

## 📱 Mobile Responsiveness

The web app is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🆚 Web vs Mobile App

| Feature | Web App | Mobile App |
|---------|---------|------------|
| Login/Signup | ✅ | ✅ |
| Glucose Tracking | ✅ | ✅ |
| Symptom Logging | ✅ | ✅ |
| Cycle Tracking | ✅ | ✅ |
| Apple Health Sync | ❌ | ✅ |
| Push Notifications | ❌ | ✅ |
| Offline Mode | ❌ | ✅ |
| Charts/Graphs | Basic | Advanced |

## 🔄 Syncing with Mobile

Users can:
1. Use web app while waiting for iOS approval
2. Data is saved to same backend database
3. Once mobile app is approved, login with same credentials
4. All data syncs automatically

## 📞 Support

If users have issues:
1. Check this README
2. Email: alexiavalen304@gmail.com
3. Report issues on GitHub

## 🚧 Future Enhancements

- [ ] Data visualization charts
- [ ] Export data to PDF
- [ ] Coach messaging interface
- [ ] Advanced filtering and search
- [ ] Dark mode
- [ ] Multi-language support

## 📝 License

Same license as main GraceFlow project

---

**Built with ❤️ using React, TypeScript, and Vite**

For questions or issues, contact: alexiavalen304@gmail.com
