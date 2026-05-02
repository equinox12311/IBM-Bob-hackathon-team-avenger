# Mobile App - Missing Features Implementation Guide

## Overview
This guide provides complete implementation details for adding the 7 missing web features to the mobile app.

## ✅ Completed Features
1. **Settings Page** - `app/settings.tsx` ✅ DONE

## 📋 Remaining Features to Implement

### 1. Today Hub (`app/today.tsx`)
**Priority: HIGH** - Most useful mobile feature

**API Endpoints:**
- `GET /api/v1/today` - Today's summary
- `GET /api/v1/entries?limit=10` - Recent entries
- `GET /api/v1/analytics/session?window=90` - Session analytics

**Key Components:**
- Greeting with time-based message
- Quick capture input
- Today's stats (entries, kinds breakdown)
- Recent entries list
- Quick actions (Search, GitHub, Report)
- Calendar events (mock data or future API)
- Task list (mock data or future API)

**Implementation:**
```typescript
// Use existing API functions from src/services/api.ts
import { apiGetToday, apiListEntries, apiCreateEntry } from '../src/services/api';

// Mobile-optimized layout with ScrollView
// Cards for stats, recent entries, quick actions
// Pull-to-refresh functionality
```

---

### 2. Productivity Metrics (`app/productivity.tsx`)
**Priority: HIGH** - Quantifiable ROI

**API Endpoint:**
- `GET /api/v1/productivity/metrics?days=7` - Productivity metrics

**Key Components:**
- Time period selector (7, 14, 30 days)
- Key metrics cards:
  - Time saved (hours/minutes)
  - ROI ($USD)
  - Productivity gain (%)
  - Knowledge retention (%)
- Activity breakdown:
  - Proactive recalls
  - Agentic captures
  - Entries recalled
  - Avg search time
- Before/After comparison table
- Monthly ROI projection

**Implementation:**
```typescript
// Add to src/services/api.ts:
export async function apiGetProductivityMetrics(days = 7): Promise<MetricsData> {
  return apiFetch(`/api/v1/productivity/metrics?days=${days}`);
}

// Mobile UI with gradient cards, ScrollView
// Responsive grid layout for metrics
```

---

### 3. Developer Identity (`app/identity.tsx`)
**Priority: MEDIUM** - Profile visualization

**API Endpoint:**
- `GET /api/v1/identity/graph` - Developer identity graph

**Key Components:**
- Developer profile summary
- Skills/technologies graph
- Project contributions
- Learning trajectory
- Code patterns analysis

**Implementation:**
```typescript
// Add to src/services/api.ts:
export async function apiGetIdentityGraph(): Promise<IdentityGraph> {
  return apiFetch('/api/v1/identity/graph');
}

// Use React Native charts library for visualizations
// npm install react-native-chart-kit
```

---

### 4. In-Session Analytics (`app/session.tsx`)
**Priority: MEDIUM** - Real-time coding metrics

**API Endpoint:**
- `GET /api/v1/analytics/session?window=90` - Session analytics

**Key Components:**
- Current session timer
- Real-time entry count
- Files touched
- Kinds breakdown
- Session productivity score
- Break reminders integration

**Implementation:**
```typescript
// Reuse existing apiGetSessionAnalytics from api.ts
// Add real-time updates with setInterval
// Mobile-optimized dashboard with live stats
```

---

### 5. Debugging Helper (`app/debugging.tsx`)
**Priority: LOW** - Desktop-focused feature

**API Endpoint:**
- `POST /api/v1/debug/analyze` - Analyze error/code

**Key Components:**
- Error message input
- Stack trace input
- Context/code snippet input
- AI-powered analysis
- Suggested fixes
- Related entries from knowledge base

**Implementation:**
```typescript
// Add to src/services/api.ts:
export async function apiDebugAnalyze(error: string, context?: string): Promise<DebugAnalysis> {
  return apiFetch('/api/v1/debug/analyze', {
    method: 'POST',
    body: JSON.stringify({ error, context }),
  });
}

// Multi-line TextInput for error/code
// Scrollable results with syntax highlighting
```

---

### 6. Developer News (`app/news.tsx`)
**Priority: LOW** - Can use web version

**API Endpoint:**
- `GET /api/v1/news/feed` - Aggregated tech news

**Key Components:**
- News feed with articles
- Filter by category (AI, Web, Mobile, etc.)
- Bookmark/save articles
- Share functionality
- Read later list

**Implementation:**
```typescript
// Add to src/services/api.ts:
export async function apiGetNewsFeed(category?: string): Promise<NewsArticle[]> {
  const params = category ? `?category=${category}` : '';
  return apiFetch(`/api/v1/news/feed${params}`);
}

// FlatList for infinite scroll
// Pull-to-refresh
// Category filter chips
```

---

### 7. Login Page (`app/login.tsx`)
**Priority: LOW** - Token-based auth sufficient

**Current Auth:**
- Token stored in AsyncStorage
- Set via Profile page

**Enhanced Login (Optional):**
- QR code scanning for token
- Biometric authentication
- Remember device
- Multi-account support

**Implementation:**
```typescript
// Use expo-local-authentication for biometrics
// Use expo-barcode-scanner for QR codes
// Store encrypted tokens in SecureStore
```

---

## 🔧 Implementation Steps

### Step 1: Add API Functions
Update `src/services/api.ts` with new endpoints:

```typescript
// Productivity Metrics
export async function apiGetProductivityMetrics(days = 7): Promise<any> {
  return apiFetch(`/api/v1/productivity/metrics?days=${days}`);
}

// Identity Graph
export async function apiGetIdentityGraph(): Promise<any> {
  return apiFetch('/api/v1/identity/graph');
}

// Debug Analysis
export async function apiDebugAnalyze(error: string, context?: string): Promise<any> {
  return apiFetch('/api/v1/debug/analyze', {
    method: 'POST',
    body: JSON.stringify({ error, context }),
  });
}

// News Feed
export async function apiGetNewsFeed(category?: string): Promise<any> {
  const params = category ? `?category=${category}` : '';
  return apiFetch(`/api/v1/news/feed${params}`);
}
```

### Step 2: Create Page Files
Create each page in `cortex-mobile/app/`:
- `today.tsx`
- `productivity.tsx`
- `identity.tsx`
- `session.tsx`
- `debugging.tsx`
- `news.tsx`
- `login.tsx` (optional)

### Step 3: Update Navigation
Update `app/_layout.tsx` to include new tabs/routes.

### Step 4: Test Each Feature
- Test API connectivity
- Test UI responsiveness
- Test offline mode
- Test error handling

---

## 📱 Mobile-Specific Considerations

### Performance
- Use FlatList for long lists (not ScrollView)
- Implement pagination for large datasets
- Cache API responses in AsyncStorage
- Lazy load images and heavy components

### UX
- Pull-to-refresh on all list views
- Loading states with skeletons
- Error states with retry buttons
- Empty states with helpful messages
- Haptic feedback on interactions

### Offline Support
- Cache last fetched data
- Show cached data with "offline" indicator
- Queue actions for when online
- Sync when connection restored

### Platform Differences
- iOS: Use native navigation patterns
- Android: Use Material Design patterns
- Handle safe areas (notches, home indicators)
- Respect system dark mode

---

## 🎨 Design System

All pages should use:
- **Colors**: From `src/constants/theme.ts`
- **Typography**: IBM Plex Sans
- **Spacing**: Consistent padding/margins
- **Components**: Reusable card, button, input components

---

## 🚀 Quick Start Template

```typescript
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Colors } from '../src/constants/theme';
import { apiFunction } from '../src/services/api';

export default function NewFeaturePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await apiFunction();
      setData(result);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Feature Name</Text>
      </View>
      {/* Your content here */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
});
```

---

## 📊 Current Status

| Feature | Status | Priority | Complexity |
|---------|--------|----------|------------|
| Settings | ✅ Done | High | Low |
| Today Hub | ⏳ Pending | High | Medium |
| Productivity Metrics | ⏳ Pending | High | Medium |
| Developer Identity | ⏳ Pending | Medium | High |
| In-Session Analytics | ⏳ Pending | Medium | Low |
| Debugging Helper | ⏳ Pending | Low | Medium |
| Developer News | ⏳ Pending | Low | Low |
| Login Page | ⏳ Pending | Low | Low |

---

## 🎯 Recommended Implementation Order

1. **Settings** ✅ (Done)
2. **Today Hub** - Most useful for mobile
3. **Productivity Metrics** - High value feature
4. **In-Session Analytics** - Reuses existing API
5. **Developer Identity** - Requires visualization library
6. **Debugging Helper** - Desktop-focused but useful
7. **Developer News** - Nice to have
8. **Login Page** - Optional enhancement

---

## 📝 Notes

- All API endpoints are already implemented in `cortex-api`
- Mobile app just needs UI implementation
- Reuse existing API client functions where possible
- Follow existing mobile app patterns (see `timeline.tsx`, `search.tsx`)
- Test on both iOS and Android
- Ensure offline mode works for all features

---

**Estimated Time:**
- Today Hub: 4-6 hours
- Productivity Metrics: 3-4 hours
- Developer Identity: 6-8 hours (with charts)
- In-Session Analytics: 2-3 hours
- Debugging Helper: 3-4 hours
- Developer News: 2-3 hours
- Login Page: 2-3 hours

**Total: ~22-31 hours** for complete feature parity