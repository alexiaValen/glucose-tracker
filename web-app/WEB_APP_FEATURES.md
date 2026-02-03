# GraceFlow Web App - Feature Parity Update

## Overview
The GraceFlow web application now has **full feature parity** with the mobile app. All core functionality is available in a clean, maintainable single-file React application.

---

## ✨ New Features Added

### 1. **Messaging System** 
**Location:** Messages Tab

**Features:**
- View all conversations with coaches/clients
- Real-time message thread display
- Send and receive messages
- Unread message indicators
- Auto-scroll to latest messages
- Coach discovery (automatically shows assigned coach as conversation option)

**How it works:**
- Users can message their assigned coach
- Coaches can message any of their clients
- Messages are organized by conversation
- Visual distinction between sent/received messages

---

### 2. **Group Coaching**
**Location:** Groups Tab

**Features:**
- Browse available group coaching programs
- View group details (name, description, schedule, duration)
- Join groups with one click
- Track "My Groups" separately from available groups
- Meeting schedule display (day, time, timezone)

**Group Information Displayed:**
- Program name and description
- Start date
- Duration in weeks
- Meeting schedule (e.g., "Tuesdays at 7:00 PM EST")

---

### 3. **Settings Screen**
**Location:** Settings Tab

**Features:**
- Account information display
  - Full name
  - Email address
  - Role (User/Coach)
- Preferences management
  - Cycle tracking toggle (enable/disable)
  - Persisted to localStorage
- Account actions
  - Logout button

---

### 4. **Enhanced Coach Dashboard**
**Location:** Auto-loads for coach role users

**Features:**
- Client list view (sidebar)
- Client selection interface
- Individual client details
  - Name and email
  - Latest glucose reading
  - Recent glucose history (last 10 readings)
- Clean two-column layout (clients list + selected client detail)

**Coach Workflow:**
1. See all assigned clients in left sidebar
2. Click a client to view their data
3. See their recent glucose readings
4. Future: Send messages (via Messages tab)

---

## 🏗️ Architecture Improvements

### Clean Separation of Concerns

**Tab-based Navigation:**
```
User Dashboard:
├── Overview (dashboard summary)
├── Glucose (full glucose tracking)
├── Symptoms (symptom logging)
├── Cycle (cycle tracking)
├── Messages (conversations)
├── Groups (group coaching)
└── Settings (account & preferences)

Coach Dashboard:
├── Clients List
├── Client Detail View
└── Messages (coach-client communication)
```

### Typed API Service
All API calls are centralized in the `ApiService` class with proper TypeScript types:

```typescript
class ApiService {
  // Auth
  async login(email: string, password: string): Promise<User>
  async register(userData: any): Promise<User>
  
  // Glucose
  async getGlucoseReadings(): Promise<GlucoseReading[]>
  async createGlucoseReading(reading): Promise<GlucoseReading>
  
  // Symptoms
  async getSymptoms(): Promise<Symptom[]>
  async createSymptom(symptom): Promise<Symptom>
  
  // Cycle
  async getCurrentCycle(): Promise<Cycle | null>
  async startCycle(startDate: string): Promise<Cycle>
  
  // Messaging
  async getConversations(): Promise<Conversation[]>
  async getMessages(otherUserId: number): Promise<Message[]>
  async sendMessage(receiverId: number, message: string): Promise<Message>
  
  // Coach
  async getMyCoach(): Promise<Coach | null>
  async getClients(): Promise<Client[]>
  async getClientGlucose(clientId: number): Promise<GlucoseReading[]>
  
  // Groups
  async getAvailableGroups(): Promise<Group[]>
  async joinGroup(groupId: string): Promise<void>
  async getMyGroups(): Promise<Group[]>
}
```

### Context-based State Management

```typescript
interface AppContextType {
  // Core state
  user: User | null
  isAuthenticated: boolean
  
  // Data
  glucoseReadings: GlucoseReading[]
  glucoseStats: GlucoseStats | null
  symptoms: Symptom[]
  currentCycle: Cycle | null
  myCoach: Coach | null
  conversations: Conversation[]
  myGroups: Group[]
  
  // Actions
  login, register, logout
  addGlucoseReading, addSymptom, startCycle
  sendMessage, getMessages
  joinGroup
  refreshData
}
```

---

## 🎨 UI/UX Design

### Consistent Design System
- **Color Palette:**
  - Sage Green: `#6B7F6E` (primary)
  - Cream: `#FAF8F4` (background)
  - Dark Text: `#2A2D2A`
  - Light Text: `#6B6B6B`
  - Error Red: `#C85A54`

- **Typography:**
  - System fonts for performance
  - Clear hierarchy (32px headings → 14px labels)

- **Components:**
  - Rounded corners (8px, 12px, 16px)
  - Consistent padding (16px, 24px)
  - Subtle shadows for cards
  - Smooth transitions (0.2s)

### Responsive Layout
- Max width: 1200px centered
- Grid layouts for cards (auto-fit, min 300px)
- Two-column layouts for messaging/coach views
- Mobile-friendly forms

---

## 📊 Feature Comparison: Mobile vs Web

| Feature | Mobile App | Web App |
|---------|-----------|---------|
| **Authentication** | ✅ | ✅ |
| **Dashboard Overview** | ✅ | ✅ |
| **Glucose Tracking** | ✅ | ✅ |
| **Symptom Logging** | ✅ | ✅ |
| **Cycle Tracking** | ✅ | ✅ |
| **Messaging** | ✅ | ✅ NEW |
| **Group Coaching** | ✅ | ✅ NEW |
| **Settings** | ✅ | ✅ NEW |
| **Coach Dashboard** | ✅ | ✅ ENHANCED |
| **Client Management** | ✅ | ✅ ENHANCED |
| **Apple Health Sync** | ✅ | ❌ (Web limitation) |

---

## 🚀 Getting Started

### Installation
```bash
# No additional dependencies needed!
# Uses same package.json as before
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Environment Variables
```bash
VITE_API_URL=http://localhost:3000
```

---

## 🔐 Security Notes

### Token Management
- Access tokens stored in `localStorage`
- Refresh tokens stored in `localStorage`
- User data cached in `localStorage`
- Auto-logout on token expiration

### API Authentication
- All protected routes use Bearer token
- Tokens included in `Authorization` header
- Proper error handling for 401/403 responses

---

## 📝 Code Quality

### Best Practices Implemented

1. **TypeScript Everywhere**
   - Strict typing for all data structures
   - No `any` types in production code
   - Proper interface definitions

2. **Error Handling**
   - Try-catch blocks on all async operations
   - User-friendly error messages
   - Graceful degradation (empty arrays on failure)

3. **Performance**
   - Single API service instance
   - Efficient re-renders with React Context
   - Lazy loading of conversation messages
   - Auto-scroll optimization

4. **Maintainability**
   - Clear component separation
   - Consistent naming conventions
   - Self-documenting code
   - Minimal prop drilling

---

## 🎯 User Flows

### User Journey: New User
1. Register → Select role (User/Coach)
2. Login → Auto-redirect to dashboard
3. Overview shows empty states with helpful prompts
4. Log first glucose reading
5. Log first symptom
6. Start cycle tracking
7. Check if coach assigned (Messages tab)
8. Browse and join groups

### User Journey: Returning User
1. Login → Dashboard overview
2. See glucose stats, cycle day, recent symptoms
3. Quick navigation to any feature via tabs
4. Message coach if needed
5. Track new data as needed

### Coach Journey
1. Login → Coach dashboard
2. See all clients in sidebar
3. Select client → View their glucose data
4. Message client via Messages tab
5. Monitor client progress

---

## 🔄 Data Flow

```
User Action (e.g., "Log Glucose")
    ↓
Component calls context method (addGlucoseReading)
    ↓
Context method calls API service
    ↓
API service makes authenticated request
    ↓
Server processes and returns data
    ↓
Context updates state
    ↓
Component re-renders with new data
    ↓
User sees updated UI
```

---

## 🐛 Known Limitations

1. **No Apple Health Integration**
   - Web apps cannot access native HealthKit
   - Users must manually log glucose readings
   
2. **No Push Notifications**
   - Web notifications require service worker setup
   - Currently not implemented

3. **No Offline Support**
   - Requires active internet connection
   - Future: Add service worker for offline caching

4. **No File Uploads**
   - No image/document uploads in messaging
   - Text-only communication

---

## 🔮 Future Enhancements

### Short Term
- [ ] Real-time messaging (WebSockets)
- [ ] Notification system
- [ ] Dark mode
- [ ] Export data (CSV/PDF)

### Medium Term
- [ ] Advanced data visualization (charts/graphs)
- [ ] Symptom correlation analysis
- [ ] Group chat functionality
- [ ] Coach notes on clients

### Long Term
- [ ] Mobile app parity for Apple Health
- [ ] AI-powered insights
- [ ] Integration with CGMs (Continuous Glucose Monitors)
- [ ] Video call integration for coaching

---

## 📚 API Endpoints Used

### Authentication
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`

### Glucose
- `GET /api/v1/glucose`
- `POST /api/v1/glucose`

### Symptoms
- `GET /api/v1/symptoms`
- `POST /api/v1/symptoms`

### Cycle
- `GET /api/v1/cycles/current`
- `POST /api/v1/cycles`

### Messages
- `GET /api/v1/messages/conversations`
- `GET /api/v1/messages/:userId`
- `POST /api/v1/messages`
- `PUT /api/v1/messages/:messageId/read`

### Coach
- `GET /api/v1/coach/my-coach`
- `GET /api/v1/coach/clients`
- `GET /api/v1/coach/clients/:clientId/glucose`

### Groups
- `GET /api/v1/groups`
- `GET /api/v1/groups/my-groups`
- `POST /api/v1/groups/:groupId/join`

---

## 💡 Development Tips

### Adding New Features
1. Define TypeScript interfaces in types section
2. Add API method to `ApiService`
3. Add state to `AppContext`
4. Create new tab component
5. Add to navigation

### Debugging
- Check browser console for API errors
- Verify tokens in localStorage
- Use React DevTools for state inspection
- Check Network tab for failed requests

### Testing
- Test all user flows manually
- Verify coach/user role switching
- Test error states (network failures)
- Verify localStorage persistence

---

## 🙏 Credits

**Design Philosophy:** 
Faith-forward, calm, human-centered wellness

**Tech Stack:**
- React 18
- TypeScript
- Vite
- Express (backend)

**Architecture:**
Single-file component for simplicity and rapid development

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review mobile app code for reference
3. Inspect API endpoint contracts
4. Verify backend is running

---

**Last Updated:** February 2026
**Version:** 2.0.0 (Feature Parity Release)