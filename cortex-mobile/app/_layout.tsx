/**
 * Root layout — handles:
 *   - Theme provider (light/dark/system) wrapping the entire tree
 *   - Font loading (Plus Jakarta Sans, Space Grotesk, Ionicons glyphs)
 *   - Splash hold until fonts are ready (fixes the "upside-down triangle" bug
 *     where Ionicons would render before the font file finished loading)
 *   - Tab bar with the new icons-only Apple-style design + a center FAB for Capture
 */

import { Ionicons } from '@expo/vector-icons';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
} from '@expo-google-fonts/space-grotesk';
import { Tabs, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Shadow } from '../src/constants/theme';
import { ThemeProvider, useThemeMode } from '../src/hooks/useThemeMode';
import { getDB } from '../src/services/database';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'SpaceGrotesk-Regular': SpaceGrotesk_400Regular,
    'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
    ...Ionicons.font,
  });

  const onReady = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) onReady();
  }, [fontsLoaded, onReady]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}

function RootLayoutInner() {
  const insets = useSafeAreaInsets();
  const { Colors, scheme } = useThemeMode();
  const router = useRouter();

  useEffect(() => {
    try { getDB(); } catch (e) { console.error('DB init failed:', e); }
  }, []);

  const TAB_PB = Math.max(insets.bottom, 8);
  // Cleaner: 22 (icon) + 10 (top pad) + insets — no labels
  const TAB_HEIGHT = 22 + 10 + TAB_PB + 10;

  return (
    <>
      <StatusBar
        style={scheme === 'dark' ? 'light' : 'dark'}
        backgroundColor={Colors.surfaceContainerLowest}
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: Colors.surfaceContainerLowest,
            borderTopColor: Colors.outlineVariant,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: TAB_HEIGHT,
            paddingTop: 10,
            paddingBottom: TAB_PB,
            elevation: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            position: 'absolute',
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.outline,
          tabBarItemStyle: { paddingVertical: 0 },
        }}
      >
        {/* ── Primary tabs: Today, Search, Ask, More ── */}
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
            tabBarAccessibilityLabel: 'Today',
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
            ),
            tabBarAccessibilityLabel: 'Search',
          }}
        />

        {/* Center FAB slot — Capture */}
        <Tabs.Screen
          name="capture"
          options={{
            tabBarButton: (props) => (
              <Pressable
                onPress={() => router.push('/capture')}
                style={[styles.fab, Shadow.cardPrimary, { backgroundColor: Colors.primary }]}
                accessibilityLabel="Capture"
              >
                <Ionicons name="add" size={26} color={Colors.onPrimary} />
              </Pressable>
            ),
          }}
        />

        <Tabs.Screen
          name="chat"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'sparkles' : 'sparkles-outline'}
                size={24}
                color={color}
              />
            ),
            tabBarAccessibilityLabel: 'Ask',
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'apps' : 'apps-outline'}
                size={24}
                color={color}
              />
            ),
            tabBarAccessibilityLabel: 'More',
          }}
        />

        {/* Secondary screens — hidden from tab bar */}
        <Tabs.Screen name="timeline"    options={{ href: null }} />
        <Tabs.Screen name="ideas"       options={{ href: null }} />
        <Tabs.Screen name="analytics"   options={{ href: null }} />
        <Tabs.Screen name="wellness"    options={{ href: null }} />
        <Tabs.Screen name="report"      options={{ href: null }} />
        <Tabs.Screen name="automations" options={{ href: null }} />
        <Tabs.Screen name="github"      options={{ href: null }} />
        <Tabs.Screen name="debug"       options={{ href: null }} />
        <Tabs.Screen name="identity"    options={{ href: null }} />
        <Tabs.Screen name="news"        options={{ href: null }} />
        <Tabs.Screen name="calendar"    options={{ href: null }} />
        <Tabs.Screen name="skills"      options={{ href: null }} />
        <Tabs.Screen name="scheduler"   options={{ href: null }} />
        <Tabs.Screen name="bob"         options={{ href: null }} />
        <Tabs.Screen name="security"    options={{ href: null }} />
        <Tabs.Screen name="profile"     options={{ href: null }} />
        <Tabs.Screen name="settings"    options={{ href: null }} />
        <Tabs.Screen name="workspace"   options={{ href: null }} />
        <Tabs.Screen name="explorer"    options={{ href: null }} />
        <Tabs.Screen name="wiki"        options={{ href: null }} />
        <Tabs.Screen name="entry/[id]"  options={{ href: null }} />
        <Tabs.Screen name="onboarding"  options={{ href: null, tabBarStyle: { display: 'none' } }} />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,        // hangs slightly above the tab bar
    alignSelf: 'center',
  },
});
