# Cortex Mobile vs Web - Feature Comparison

## Current Mobile App Features ✅

| Feature | Mobile | Web | Status |
|---------|--------|-----|--------|
| **Timeline** | ✅ | ✅ | Implemented |
| **Search** | ✅ | ✅ | Implemented |
| **Capture/Entry** | ✅ | ✅ | Implemented |
| **Chat/AI** | ✅ | ✅ | Implemented |
| **GitHub Activity** | ✅ | ✅ | Implemented |
| **Daily Report** | ✅ | ✅ | Implemented |
| **Automations** | ✅ | ✅ | Implemented |
| **Wellness/Touch Grass** | ✅ | ✅ | Implemented |
| **Idea Mapper** | ✅ | ✅ | Implemented |
| **Analytics** | ✅ | ✅ | Implemented |
| **Profile/Settings** | ✅ | ✅ | Implemented |
| **Entry Detail** | ✅ | ✅ | Implemented |

## Missing from Mobile (Web-Only) ❌

| Feature | Mobile | Web | Notes |
|---------|--------|-----|-------|
| **Today Hub** | ❌ | ✅ | Dashboard with tasks, calendar, notifications |
| **Debugging Helper** | ❌ | ✅ | Code debugging assistance |
| **Developer Identity** | ❌ | ✅ | Developer profile/identity graph |
| **Developer News** | ❌ | ✅ | Tech news aggregation |
| **In-Session Analytics** | ❌ | ✅ | Real-time coding session metrics |
| **Productivity Metrics** | ❌ | ✅ | Detailed productivity tracking |
| **Login Page** | ❌ | ✅ | Authentication UI |
| **Settings Page** | ❌ | ✅ | Advanced settings |

## Mobile-Specific Features 📱

| Feature | Description |
|---------|-------------|
| **Offline Mode** | SQLite local database fallback |
| **Push Notifications** | Break reminders every 30 seconds |
| **Native Navigation** | Tab-based navigation with Expo Router |
| **Secure Storage** | Expo SecureStore for tokens |
| **Network Detection** | Auto-switch between online/offline |

## Recommended Additions to Mobile

### High Priority
1. **Today Hub** - Most useful for mobile quick access
2. **Productivity Metrics** - Mobile-friendly dashboard
3. **Settings Page** - Centralized configuration

### Medium Priority
4. **Developer Identity** - View profile on-the-go
5. **In-Session Analytics** - Quick session overview

### Low Priority (Desktop-Focused)
6. **Debugging Helper** - Better suited for desktop
7. **Developer News** - Can use web version
8. **Login Page** - Token-based auth sufficient for mobile

## Implementation Status

**Mobile App Coverage**: ~70% of web features
- ✅ Core features: Timeline, Search, Capture, Chat
- ✅ Productivity: GitHub, Reports, Analytics, Automations
- ✅ Wellness: Touch Grass, Break reminders
- ✅ Ideas: Idea Mapper
- ❌ Missing: Today Hub, Advanced metrics, Settings UI

## API Compatibility

All mobile features use the same REST API endpoints as web:
- `/api/v1/entries` - Timeline, Search, Capture
- `/api/v1/chat` - AI Chat
- `/api/v1/github` - GitHub Activity
- `/api/v1/generate/report` - Daily Reports
- `/api/v1/analytics` - Analytics
- `/api/v1/wellness` - Wellness tracking
- `/api/v1/profile` - User profile

## Next Steps

To achieve feature parity with web:
1. Add Today Hub page (`app/today.tsx`)
2. Add Productivity Metrics page (`app/productivity.tsx`)
3. Add Settings page (`app/settings.tsx`)
4. Add Developer Identity page (`app/identity.tsx`)
5. Add In-Session Analytics page (`app/session.tsx`)

All API endpoints are already available - just need UI implementation.