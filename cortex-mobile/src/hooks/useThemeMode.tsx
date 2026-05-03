/**
 * useThemeMode — light/dark/system colour scheme with SecureStore persistence.
 *
 * Wrap the app once at the root with <ThemeProvider>. Components that want to
 * react to the chosen scheme call useThemeMode() to read the current palette
 * (Colors), the current scheme ('light'|'dark'), and setMode() to switch.
 *
 * Persistence is best-effort: if SecureStore isn't available (e.g. web), we
 * just keep state in memory.
 */

import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme as useSystemScheme } from 'react-native';

import { Colors as LightPalette, ColorsDark as DarkPalette } from '../constants/theme';

const STORE_KEY = 'cortex.theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedScheme = 'light' | 'dark';

interface ThemeCtx {
  mode: ThemeMode;          // user preference
  scheme: ResolvedScheme;   // resolved (system → actual OS scheme)
  Colors: typeof LightPalette;
  setMode: (next: ThemeMode) => void;
  loaded: boolean;          // false until we've read SecureStore once
}

const Ctx = createContext<ThemeCtx | null>(null);

async function readStored(): Promise<ThemeMode> {
  try {
    const v = await SecureStore.getItemAsync(STORE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // SecureStore unavailable (web) — fall through to default.
  }
  return 'system';
}

async function writeStored(mode: ThemeMode): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    readStored().then((m) => {
      setModeState(m);
      setLoaded(true);
    });
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    writeStored(next);
  }

  const value = useMemo<ThemeCtx>(() => {
    const scheme: ResolvedScheme =
      mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
    const palette = scheme === 'dark' ? DarkPalette : LightPalette;
    return {
      mode,
      scheme,
      Colors: palette as typeof LightPalette,
      setMode,
      loaded,
    };
  }, [mode, systemScheme, loaded]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useThemeMode(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fall back to a minimal sensible default — lets standalone screens render
    // even if a parent forgot to wrap in <ThemeProvider>.
    return {
      mode: 'system',
      scheme: 'light',
      Colors: LightPalette,
      setMode: () => {},
      loaded: true,
    };
  }
  return ctx;
}
