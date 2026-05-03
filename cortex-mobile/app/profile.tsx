/**
 * Profile — user identity + stats + quick links.
 *
 * Connection setup lives in Settings now (Settings → Connection); this
 * screen is the hub for who-the-user-is and how-they're-using-Cortex.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import {
  Button,
  Card,
  Header,
  IconButton,
  Pill,
  Screen,
  Section,
} from '../src/components/ui';
import { Radius, Spacing, Typography } from '../src/constants/theme';
import { useThemeMode } from '../src/hooks/useThemeMode';
import { isApiConfigured } from '../src/services/api';
import {
  getProfile,
  getWellnessStats,
  updateProfile,
  type Profile,
} from '../src/services/database';
import { getDemoProfile } from '../src/services/demoData';
import { getSessionStats } from '../src/services/memory';

const QUICK_LINKS = [
  { icon: 'leaf-outline'   as const, label: 'Wellness',  route: '/wellness',  tone: 'tertiary'  as const },
  { icon: 'logo-github'    as const, label: 'GitHub',    route: '/github',    tone: 'neutral'   as const },
  { icon: 'people-outline' as const, label: 'Identity',  route: '/identity',  tone: 'secondary' as const },
  { icon: 'bar-chart-outline' as const, label: 'Analytics', route: '/analytics', tone: 'primary' as const },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const { Colors } = useThemeMode();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<{ total: number; byKind: Record<string, number>; topTags: string[] }>({
    total: 0, byKind: {}, topTags: [],
  });
  const [wellness, setWellness] = useState({ breaks_today: 0, last_break_at: null as number | null });
  const [apiOnline, setApiOnline] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // edit form fields
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');

  const load = useCallback(async () => {
    const [p, s, w, ok] = await Promise.all([
      getProfile(),
      getSessionStats(),
      getWellnessStats(),
      isApiConfigured(),
    ]);
    const profileData = p.name && p.name !== 'Developer' ? p : (getDemoProfile() as any);
    setProfile(profileData);
    setStats(s);
    setWellness(w);
    setApiOnline(ok);
    setName(profileData.name ?? '');
    setHandle(profileData.handle ?? '');
    setBio(profileData.bio ?? '');
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function save() {
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), handle: handle.trim(), bio: bio.trim() });
      setEditing(false);
      load();
    } catch (e: any) {
      Alert.alert('Could not save', String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <>
        <Header title="Profile" back />
        <Screen padding={Spacing.md} />
      </>
    );
  }

  const initials = (profile.name || '?')
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <Header
        title="Profile"
        back
        right={
          <IconButton
            icon={editing ? 'close' : 'create-outline'}
            size="sm"
            onPress={() => setEditing((v) => !v)}
            accessibilityLabel="Edit profile"
          />
        }
      />

      <Screen padding={Spacing.md}>
        {/* Identity card */}
        <Card variant="primary" size="hero" padding="lg" style={{ marginBottom: Spacing.md }}>
          <View style={s.identityRow}>
            <View style={[s.avatar, { backgroundColor: Colors.primary }]}>
              <Text style={[Typography.h2, { color: Colors.onPrimary, letterSpacing: -1 }]}>
                {initials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              {editing ? (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Full name"
                  placeholderTextColor={Colors.outline}
                  style={[s.editInput, Typography.h3, { color: Colors.onPrimaryFixed }]}
                />
              ) : (
                <Text style={[Typography.h2, { color: Colors.onPrimaryFixed, letterSpacing: -0.5 }]}>
                  {profile.name}
                </Text>
              )}
              {editing ? (
                <TextInput
                  value={handle}
                  onChangeText={setHandle}
                  placeholder="@handle"
                  placeholderTextColor={Colors.outline}
                  autoCapitalize="none"
                  style={[s.editInput, Typography.bodySm, { color: Colors.onPrimaryFixed, opacity: 0.8 }]}
                />
              ) : (
                <Text style={[Typography.bodySm, { color: Colors.onPrimaryFixed, opacity: 0.7 }]}>
                  @{profile.handle ?? 'me'}
                </Text>
              )}
            </View>
          </View>

          {editing ? (
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Bio…"
              placeholderTextColor={Colors.outline}
              multiline
              style={[
                s.bio,
                Typography.body,
                {
                  color: Colors.onPrimaryFixed,
                  backgroundColor: Colors.surfaceContainerLowest,
                  borderRadius: Radius.lg,
                  padding: Spacing.md,
                  marginTop: Spacing.md,
                },
              ]}
            />
          ) : profile.bio ? (
            <Text style={[Typography.body, { color: Colors.onPrimaryFixed, opacity: 0.85, marginTop: Spacing.md }]}>
              {profile.bio}
            </Text>
          ) : null}

          <View style={s.pillRow}>
            <Pill
              label={apiOnline ? 'API connected' : 'Offline'}
              tone={apiOnline ? 'success' : 'neutral'}
              icon={apiOnline ? 'cloud-done' : 'cloud-offline'}
            />
            <Pill label={`${wellness.breaks_today} breaks today`} tone="primary" icon="leaf" />
          </View>

          {editing && (
            <Button
              label={saving ? 'Saving…' : 'Save'}
              icon="checkmark"
              onPress={save}
              loading={saving}
              fullWidth
              style={{ marginTop: Spacing.md }}
            />
          )}
        </Card>

        {/* Stats */}
        <Section title="Activity">
          <View style={s.statRow}>
            <StatTile label="Entries" value={stats.total} accent={Colors.primary} />
            <StatTile label="Kinds" value={Object.keys(stats.byKind).length} accent={Colors.secondary} />
            <StatTile label="Tags" value={stats.topTags.length} accent={Colors.tertiary} />
          </View>
        </Section>

        {/* Top tags */}
        {stats.topTags.length > 0 && (
          <Section title="Top tags">
            <Card variant="surface" size="list" padding="md">
              <View style={s.tagRow}>
                {stats.topTags.slice(0, 8).map((t) => (
                  <Pill key={t} label={`#${t}`} tone="primary" />
                ))}
              </View>
            </Card>
          </Section>
        )}

        {/* Quick links */}
        <Section title="Explore">
          <View style={s.linkGrid}>
            {QUICK_LINKS.map((q) => {
              const tone = {
                primary:   { bg: Colors.primaryFixed,     fg: Colors.primary   },
                secondary: { bg: Colors.secondaryFixed,   fg: Colors.secondary },
                tertiary:  { bg: Colors.tertiaryFixed,    fg: Colors.tertiary  },
                neutral:   { bg: Colors.surfaceContainer, fg: Colors.onSurface },
              }[q.tone];
              return (
                <TouchableOpacity
                  key={q.route}
                  activeOpacity={0.85}
                  onPress={() => router.push(q.route as any)}
                  style={[
                    s.linkTile,
                    { backgroundColor: Colors.surfaceContainerLowest, borderColor: Colors.outlineVariant },
                  ]}
                >
                  <View style={[s.linkIcon, { backgroundColor: tone.bg }]}>
                    <Ionicons name={q.icon} size={20} color={tone.fg} />
                  </View>
                  <Text style={[Typography.label, { color: Colors.onSurface }]}>{q.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* Settings shortcut */}
        <Button
          label="Settings & connection"
          icon="settings-outline"
          onPress={() => router.push('/settings')}
          variant="outlined"
          fullWidth
          style={{ marginTop: Spacing.sm }}
        />
      </Screen>
    </>
  );
}

function StatTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  const { Colors } = useThemeMode();
  return (
    <View style={[s.stat, { backgroundColor: Colors.surfaceContainerLowest, borderColor: Colors.outlineVariant }]}>
      <View style={[s.statBar, { backgroundColor: accent }]} />
      <Text style={[Typography.h2, { color: Colors.onSurface, marginTop: 6, letterSpacing: -0.5 }]}>{value}</Text>
      <Text style={[Typography.codeSm, { color: Colors.outline, textTransform: 'uppercase', letterSpacing: 1 }]}>
        {label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 72, height: 72, borderRadius: Radius.card,
    alignItems: 'center', justifyContent: 'center',
  },
  editInput: {
    paddingVertical: 4, marginVertical: 2,
  },
  bio: { textAlignVertical: 'top', minHeight: 80 },

  pillRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.md, flexWrap: 'wrap' },

  statRow: { flexDirection: 'row', gap: Spacing.sm },
  stat: {
    flex: 1, padding: Spacing.md, borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg, overflow: 'hidden',
  },
  statBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },

  linkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  linkTile: {
    flexBasis: '47%', flexGrow: 1,
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md,
    alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth,
  },
  linkIcon: {
    width: 48, height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
});
