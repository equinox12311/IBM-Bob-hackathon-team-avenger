/**
 * Settings — connection, appearance, about. Theme-aware.
 *
 * Three sections:
 *   1. Connection — API base URL + bearer token + Test button
 *   2. Appearance — light / dark / system
 *   3. About — version, links
 */

import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  Button,
  Card,
  Header,
  Pill,
  Screen,
  Section,
  StatusBanner,
} from '../src/components/ui';
import { ScanToConnect } from '../src/components/ScanToConnect';
import { Radius, Spacing, Typography } from '../src/constants/theme';
import { useThemeMode, type ThemeMode } from '../src/hooks/useThemeMode';
import { checkApiHealth, getApiBase, getToken, setApiBase, setToken } from '../src/services/api';

export default function SettingsScreen() {
  const { Colors, mode: themeMode, scheme, setMode } = useThemeMode();

  const [apiBaseInput, setApiBaseInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [healthMsg, setHealthMsg] = useState<string>('');
  const [scanOpen, setScanOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setApiBaseInput(await getApiBase());
      setTokenInput(await getToken());
    })();
  }, []);

  async function saveAndTest() {
    const base = apiBaseInput.trim();
    const tok = tokenInput.trim();
    if (!base || !tok) {
      Alert.alert('Missing fields', 'Both API URL and token are required.');
      return;
    }
    await setApiBase(base);
    await setToken(tok);
    setTesting(true);
    setHealthOk(null);
    setHealthMsg('');
    try {
      const r = await checkApiHealth();
      setHealthOk(true);
      setHealthMsg(`Connected · v${r.version}`);
    } catch (e: any) {
      setHealthOk(false);
      setHealthMsg(String(e?.message ?? e));
    } finally {
      setTesting(false);
    }
  }

  const inputBase = {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.input,
    padding: Spacing.md,
    color: Colors.onSurface,
    ...Typography.body,
  };

  return (
    <>
      <Header title="Settings" back />
      <Screen padding={Spacing.md}>
        {/* Connection ---------------------------------------------------- */}
        <Section title="Connection">
          {/* One-click pairing */}
          <Card variant="primary" padding="lg" size="hero" style={{ marginBottom: Spacing.sm }}>
            <Text style={[Typography.codeSm, { color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase' }]}>
              one-click
            </Text>
            <Text style={[Typography.h3, { color: Colors.onPrimaryFixed, marginTop: 4, letterSpacing: -0.5 }]}>
              Scan to connect.
            </Text>
            <Text style={[Typography.bodySm, { color: Colors.onPrimaryFixed, opacity: 0.8, marginTop: Spacing.xs }]}>
              Run <Text style={Typography.code}>make pair</Text> on your Mac, then scan the QR here.
            </Text>
            <Button
              label="Open scanner"
              icon="qr-code"
              onPress={() => setScanOpen(true)}
              variant="primary"
              fullWidth
              style={{ marginTop: Spacing.md }}
            />
          </Card>

          <Card variant="surface" padding="lg" size="hero">
            <Text style={[Typography.codeSm, { color: Colors.outline, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 2 }]}>
              or enter manually
            </Text>
            <View style={s.fieldGroup}>
              <Text style={[Typography.labelSm, { color: Colors.onSurfaceVariant, textTransform: 'uppercase' }]}>
                API base URL
              </Text>
              <TextInput
                value={apiBaseInput}
                onChangeText={setApiBaseInput}
                placeholder="http://192.168.1.213:8080"
                placeholderTextColor={Colors.outline}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={inputBase}
              />
              <Text style={[Typography.codeSm, { color: Colors.outline }]}>
                Use your computer's LAN IP — not "localhost".
              </Text>
            </View>

            <View style={s.fieldGroup}>
              <Text style={[Typography.labelSm, { color: Colors.onSurfaceVariant, textTransform: 'uppercase' }]}>
                Bearer token
              </Text>
              <TextInput
                value={tokenInput}
                onChangeText={setTokenInput}
                placeholder="DIARY_TOKEN from your .env"
                placeholderTextColor={Colors.outline}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={inputBase}
              />
            </View>

            <Button
              label={testing ? 'Testing…' : 'Save & test connection'}
              icon="flash"
              onPress={saveAndTest}
              loading={testing}
              fullWidth
              style={{ marginTop: Spacing.sm }}
            />

            {healthOk !== null && (
              <View style={{ marginTop: Spacing.md }}>
                <StatusBanner
                  tone={healthOk ? 'success' : 'error'}
                  title={healthOk ? 'Connected' : 'Could not connect'}
                  body={healthMsg}
                />
              </View>
            )}
          </Card>
        </Section>

        {/* Appearance ---------------------------------------------------- */}
        <Section title="Appearance">
          <Card variant="surface" padding="md" size="hero">
            <View style={s.appearanceHeader}>
              <Text style={[Typography.body, { color: Colors.onSurface }]}>Theme</Text>
              <Pill label={`${scheme} mode`} tone="primary" />
            </View>
            <View style={s.modeRow}>
              {(['system', 'light', 'dark'] as ThemeMode[]).map((m) => {
                const active = themeMode === m;
                return (
                  <Button
                    key={m}
                    label={m === 'system' ? 'Auto' : m === 'light' ? 'Light' : 'Dark'}
                    onPress={() => setMode(m)}
                    variant={active ? 'primary' : 'secondary'}
                    size="sm"
                    icon={m === 'system' ? 'phone-portrait' : m === 'light' ? 'sunny' : 'moon'}
                  />
                );
              })}
            </View>
          </Card>
        </Section>

        {/* QR scanner modal --------------------------------------------- */}
        <ScanToConnect
          visible={scanOpen}
          onClose={() => setScanOpen(false)}
          onSuccess={async ({ url, version }) => {
            setScanOpen(false);
            setApiBaseInput(url);
            setTokenInput(await getToken());
            setHealthOk(true);
            setHealthMsg(`Paired · v${version}`);
          }}
        />

        {/* About --------------------------------------------------------- */}
        <Section title="About">
          <Card variant="surface" padding="lg" size="hero">
            <Text style={[Typography.h3, { color: Colors.onSurface, letterSpacing: -0.5 }]}>
              cortex
            </Text>
            <Text style={[Typography.bodySm, { color: Colors.onSurfaceVariant, marginTop: 2 }]}>
              your developer's second brain.
            </Text>
            <View style={[s.divider, { backgroundColor: Colors.outlineVariant }]} />
            <View style={s.aboutRow}>
              <Text style={[Typography.bodySm, { color: Colors.onSurfaceVariant }]}>Version</Text>
              <Text style={[Typography.code, { color: Colors.outline }]}>0.3.0</Text>
            </View>
            <View style={s.aboutRow}>
              <Text style={[Typography.bodySm, { color: Colors.onSurfaceVariant }]}>Built on</Text>
              <Text style={[Typography.code, { color: Colors.outline }]}>IBM Bob · Granite</Text>
            </View>
          </Card>
        </Section>
      </Screen>
    </>
  );
}

const s = StyleSheet.create({
  fieldGroup: { gap: Spacing.xs, marginBottom: Spacing.md },
  appearanceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  modeRow: { flexDirection: 'row', gap: Spacing.sm },
  aboutRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.md,
  },
});
