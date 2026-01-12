# 🌿 GraceFlow

> *Empowering women to understand the connection between hormonal cycles and blood glucose levels*

A comprehensive mobile health platform that integrates glucose monitoring with menstrual cycle tracking, featuring real-time coaching, Apple Health synchronization, and data-driven insights.

[![React Native](https://img.shields.io/badge/React%20Native-0.74-61DAFB?logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://www.postgresql.org/)

## 📱 Screenshots

| Dashboard | Glucose Tracking | Cycle Tracking | Apple Health Sync |
|-----------|------------------|----------------|-------------------|
| ![Dashboard](./docs/screenshots/dashboard.png) | ![Glucose](./docs/screenshots/glucose.png) | ![Cycle](./docs/screenshots/cycle.png) | ![Health](./docs/screenshots/health-sync.png) |

*Beautiful nature-themed UI with botanical backgrounds and intuitive data visualization*

## ✨ Features

### 🩸 Glucose Monitoring
- **Manual Entry**: Quick glucose logging with timestamp and notes
- **Apple Health Integration**: Automatic sync with CGM devices and Apple Watch
- **Data Visualization**: Interactive charts showing glucose trends and patterns
- **Range Tracking**: Monitor time in range with color-coded indicators
- **Historical Data**: Access complete glucose history with filtering options

### 🌸 Cycle Tracking
- **Phase Monitoring**: Track menstrual, follicular, ovulation, and luteal phases
- **Symptom Logging**: Record physical and emotional symptoms with severity ratings
- **Pattern Recognition**: Identify correlations between cycle phases and glucose levels
- **Predictions**: Smart cycle phase predictions based on historical data
- **Visual Calendar**: Month-view calendar with cycle indicators

### 💬 Real-Time Coaching
- **Direct Messaging**: Secure coach-client communication platform
- **Data Sharing**: Coaches can view client glucose and cycle data with permission
- **Personalized Insights**: Receive tailored recommendations based on your data
- **Progress Tracking**: Monitor improvements over time with coach guidance

### 🍎 Apple HealthKit Integration
- **Bi-directional Sync**: Read from and write to Apple Health seamlessly
- **CGM Support**: Automatic import from continuous glucose monitors
- **Apple Watch**: Sync data from Apple Watch health apps
- **Background Sync**: Optional automatic syncing every 15 minutes
- **Privacy First**: All health data stays on your device until you choose to sync

### 📊 Data Analytics
- **Trend Analysis**: Visualize glucose patterns over days, weeks, and months
- **Cycle Correlation**: See how cycle phases affect glucose levels
- **Statistics Dashboard**: Average, highest, lowest, and time in range metrics
- **Export Data**: Download your data for personal records or sharing with healthcare providers

## 🛠️ Tech Stack

### Frontend (Mobile)
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Zustand
- **Navigation**: React Navigation 6
- **UI Components**: Custom component library with nature-themed design
- **Charts**: Custom data visualization components
- **Native Modules**: 
  - `react-native-health` (Apple HealthKit)
  - `@react-native-async-storage/async-storage`
  - `react-native-svg`

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15
- **ORM**: Prisma (or your ORM)
- **Authentication**: JWT with refresh tokens
- **Real-time**: WebSockets (Socket.io)
- **API**: RESTful architecture with versioning

### Infrastructure
- **Auth & Storage**: Supabase
- **Database Hosting**: Supabase PostgreSQL
- **File Storage**: Supabase Storage (for profile images, exports)
- **Real-time**: Supabase Realtime (messaging)

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- iOS development environment (Xcode 15+, macOS)
- PostgreSQL 15+ (or Supabase account)
- Apple Developer account (for HealthKit)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/graceflow.git
cd graceflow
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Set up backend environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

```env
# Backend .env
DATABASE_URL=postgresql://user:password@localhost:5432/graceflow_db
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
PORT=3000
NODE_ENV=development
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. **Run database migrations**
```bash
npm run migrate
```

5. **Start backend server**
```bash
npm run dev
```

6. **Install mobile app dependencies**
```bash
cd ../mobile-app
npm install
```

7. **Set up mobile environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

```env
# Mobile .env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

8. **Configure Apple HealthKit** (iOS only)

Add to `ios/GraceFlow/Info.plist`:
```xml
<key>NSHealthShareUsageDescription</key>
<string>GraceFlow needs access to read your blood glucose data from Apple Health.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>GraceFlow would like to save your blood glucose readings to Apple Health.</string>
```

Create `ios/GraceFlow/GraceFlow.entitlements`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.healthkit</key>
    <true/>
</dict>
</plist>
```

9. **Run on iOS device**
```bash
# HealthKit only works on real devices, not simulators
npx expo run:ios --device
```

## 📁 Project Structure

```
graceflow/
├── mobile-app/                 # React Native mobile application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── BotanicalBackground.tsx
│   │   │   ├── GlucoseChart.tsx
│   │   │   └── ...
│   │   ├── screens/            # App screens
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── AddGlucoseScreen.tsx
│   │   │   ├── LogCycleScreen.tsx
│   │   │   ├── HealthSyncScreen.tsx
│   │   │   └── ...
│   │   ├── services/           # API & business logic
│   │   │   ├── api.ts
│   │   │   ├── glucose.service.ts
│   │   │   ├── cycle.service.ts
│   │   │   ├── healthkit.service.ts
│   │   │   └── ...
│   │   ├── stores/             # State management (Zustand)
│   │   │   ├── authStore.ts
│   │   │   └── ...
│   │   ├── navigation/         # Navigation configuration
│   │   ├── theme/              # Colors, typography, styles
│   │   ├── types/              # TypeScript type definitions
│   │   └── assets/             # Images, fonts, icons
│   ├── ios/                    # iOS native code
│   └── package.json
│
├── backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── routes/             # API route handlers
│   │   │   ├── auth.routes.ts
│   │   │   ├── glucose.routes.ts
│   │   │   ├── cycle.routes.ts
│   │   │   └── ...
│   │   ├── controllers/        # Request handling logic
│   │   ├── models/             # Database models
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── services/           # Business logic
│   │   └── utils/              # Helper functions
│   ├── prisma/                 # Database schema & migrations
│   │   └── schema.prisma
│   └── package.json
│
└── docs/                       # Documentation & screenshots
    ├── screenshots/
    ├── api-docs.md
    └── architecture.md
```

## 🏗️ Architecture

### Mobile App Architecture
```
┌─────────────────────────────────────────┐
│         React Native (TypeScript)       │
│  ┌────────────────────────────────────┐ │
│  │  UI Components & Screens           │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  State Management (Zustand)        │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Services Layer                    │ │
│  │  • API Client                      │ │
│  │  • HealthKit Integration           │ │
│  │  • Local Storage                   │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
            ↕                    ↕
    ┌──────────────┐      ┌──────────────┐
    │ Apple Health │      │  Backend API │
    └──────────────┘      └──────────────┘
```

### Backend Architecture
```
┌─────────────────────────────────────────┐
│        Express.js REST API              │
│  ┌────────────────────────────────────┐ │
│  │  Routes & Controllers              │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Middleware                        │ │
│  │  • Authentication (JWT)            │ │
│  │  • Validation                      │ │
│  │  • Error Handling                  │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Services & Business Logic         │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Database Layer (Prisma/ORM)       │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                ↕
        ┌──────────────┐
        │  PostgreSQL  │
        └──────────────┘
```

## 🔐 Security

- **Authentication**: JWT-based auth with access and refresh tokens
- **Data Encryption**: All sensitive data encrypted at rest and in transit
- **Health Data Privacy**: HIPAA-compliant data handling practices
- **API Security**: Rate limiting, CORS configuration, input validation
- **Secure Storage**: AsyncStorage with encryption for sensitive local data

## 🧪 API Documentation

### Authentication Endpoints
```
POST   /api/v1/auth/register       # Create new user account
POST   /api/v1/auth/login          # Login user
POST   /api/v1/auth/refresh        # Refresh access token
POST   /api/v1/auth/logout         # Logout user
```

### Glucose Endpoints
```
GET    /api/v1/glucose             # Get all glucose readings
POST   /api/v1/glucose             # Create glucose reading
GET    /api/v1/glucose/:id         # Get specific reading
PUT    /api/v1/glucose/:id         # Update reading
DELETE /api/v1/glucose/:id         # Delete reading
GET    /api/v1/glucose/stats       # Get glucose statistics
```

### Cycle Endpoints
```
GET    /api/v1/cycles              # Get all cycle records
POST   /api/v1/cycles              # Log cycle start
GET    /api/v1/cycles/current      # Get current cycle info
GET    /api/v1/cycles/:id          # Get specific cycle
```

### Symptom Endpoints
```
GET    /api/v1/symptoms            # Get all symptoms
POST   /api/v1/symptoms            # Log symptom
DELETE /api/v1/symptoms/:id        # Delete symptom
```

For detailed API documentation, see [API Docs](./docs/api-docs.md)

## 🎨 Design System

### Color Palette
```typescript
colors: {
  sage: '#6B7F6E',           // Primary brand color
  goldLeaf: '#B8A45F',       // Secondary accent
  warmBrown: '#8B6F47',      // Tertiary accent
  cream: '#F5F4F0',          // Background
  paleGreen: '#E8F0E8',      // Light backgrounds
  charcoal: '#3A3A3A',       // Dark text
  white: '#FFFFFF',          // Cards & surfaces
}
```

### Typography
- **Headings**: SF Pro Display (iOS), System Default
- **Body**: SF Pro Text (iOS), System Default
- **Sizes**: 12px, 14px, 16px, 18px, 20px, 24px, 28px, 32px

### Components
- **Buttons**: 16px border radius, consistent padding, clear states
- **Cards**: 16px border radius, subtle shadows, white backgrounds
- **Inputs**: 16px border radius, 2px borders, focus states
- **Icons**: Nature-themed emoji icons for intuitive recognition

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run mobile tests
cd mobile-app
npm test

# Run E2E tests
npm run test:e2e
```

## 📈 Future Enhancements

- [ ] **Machine Learning**: Predictive glucose trend analysis
- [ ] **Food Logging**: Track meals and their impact on glucose
- [ ] **Social Features**: Connect with other users for support
- [ ] **Export Reports**: Generate PDF reports for healthcare providers
- [ ] **Medication Tracking**: Log insulin, medications, and supplements
- [ ] **Wearable Integration**: Support for additional fitness trackers
- [ ] **Android Version**: Expand to Android with Google Fit integration
- [ ] **Web Dashboard**: Coach portal for managing multiple clients
- [ ] **Notifications**: Smart reminders for glucose checks and cycle tracking
- [ ] **Data Backup**: Cloud backup and restore functionality

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes tests where appropriate.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

**Alexia Valenzuela** - *Full-Stack Developer* - (https://github.com/alexiavalen)

## 🙏 Acknowledgments

- Apple HealthKit for health data integration
- React Native community for excellent tooling
- Women's health advocates for inspiring this project
- Beta testers for valuable feedback

## 📞 Contact

- **Email**: alexiavalen304@gmail.com
- **LinkedIn**: [Your LinkedIn](https://linkedin.com/in/alexiavalen)
- **Project Link**: [https://github.com/alexiavalen/graceflow](https://github.com/alexiavalen/graceflow)

---

<div align="center">
  Made with 💚 for women's health
  
  ⭐ Star this repo if you find it helpful!
</div>