import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/theme';
import { getDB } from '../src/services/database';

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    try { getDB(); } catch (e) { console.error('DB init failed:', e); }
  }, []);

  // Tab bar sits exactly on top of the system home indicator.
  // icon (22) + label (12) + paddingTop (8) + paddingBottom (inset or 8) = safe height
  const TAB_ICON = 22;
  const TAB_LABEL = 12;
  const TAB_PT = 8;
  const TAB_PB = Math.max(insets.bottom, 8);
  const TAB_HEIGHT = TAB_ICON + TAB_LABEL + TAB_PT + TAB_PB + 10; // 10 = gap between icon and label

  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.surfaceContainerLowest} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.surfaceContainerLowest,
            borderTopColor: Colors.outlineVariant,
            borderTopWidth: 1,
            height: TAB_HEIGHT,
            paddingTop: TAB_PT,
            paddingBottom: TAB_PB,
            // No elevation/shadow that could push it off-screen
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            // Ensure it never goes below the screen
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.onSurfaceVariant,
          tabBarLabelStyle: {
            fontSize: 10,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
            fontWeight: '600',
            marginTop: 0,
          },
          tabBarIconStyle: {
            marginBottom: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'today' : 'today-outline'} size={TAB_ICON} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="capture"
          options={{
            title: 'Capture',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={TAB_ICON + 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'AI Chat',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={TAB_ICON} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'search' : 'search-outline'} size={TAB_ICON} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={TAB_ICON} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
