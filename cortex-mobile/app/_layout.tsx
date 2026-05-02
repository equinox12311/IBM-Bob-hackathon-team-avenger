import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/theme';
import { getDB } from '../src/services/database';

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    try { getDB(); } catch (e) { console.error('DB init failed:', e); }
  }, []);

  const TAB_PB = Math.max(insets.bottom, 8);
  const TAB_HEIGHT = 22 + 12 + 8 + TAB_PB + 10;

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
            paddingTop: 8,
            paddingBottom: TAB_PB,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
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
          },
        }}
      >
        {/* ── Primary 5 tabs ── */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'today' : 'today-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="capture"
          options={{
            title: 'Capture',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'AI Chat',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
            ),
          }}
        />

        {/* ── Secondary screens (hidden from tab bar) ── */}
        <Tabs.Screen name="timeline"    options={{ href: null }} />
        <Tabs.Screen name="ideas"       options={{ href: null }} />
        <Tabs.Screen name="analytics"   options={{ href: null }} />
        <Tabs.Screen name="wellness"    options={{ href: null }} />
        <Tabs.Screen name="report"      options={{ href: null }} />
        <Tabs.Screen name="automations" options={{ href: null }} />
        <Tabs.Screen name="github"      options={{ href: null }} />
        <Tabs.Screen name="profile"     options={{ href: null }} />
        <Tabs.Screen name="entry/[id]"  options={{ href: null }} />
      </Tabs>
    </>
  );
}
