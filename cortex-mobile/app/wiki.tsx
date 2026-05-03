/**
 * Wiki — auto-generated docs/wiki/<slug>.md, written by Granite from your
 * diary + indexed code. Lists existing pages, lets the user generate new
 * ones, and shows the rendered body when one is opened.
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  Button,
  Card,
  EmptyState,
  Header,
  IconButton,
  Pill,
  Screen,
  Section,
} from '../src/components/ui';
import { Radius, Spacing, Typography } from '../src/constants/theme';
import { useThemeMode } from '../src/hooks/useThemeMode';
import {
  apiGenerateWiki,
  apiGetWiki,
  apiListWiki,
  isApiConfigured,
  type WikiPageSummary,
} from '../src/services/api';

interface WikiPage {
  slug: string;
  title: string;
  category: 'guide' | 'api' | 'wiki';
  excerpt: string;
  updatedRelative: string;
}

function pickCategory(tags: string[] | undefined, title: string): WikiPage['category'] {
  const t = (tags ?? []).map((x) => x.toLowerCase());
  if (t.includes('api') || /\bapi\b|endpoint|request/i.test(title)) return 'api';
  if (t.includes('guide') || /\bguide\b|setup|deploy|install/i.test(title)) return 'guide';
  return 'wiki';
}

function relTime(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.round(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const CATEGORY = {
  guide: { label: 'Guides',        icon: 'book' as const,  tone: 'primary'   as const },
  api:   { label: 'API Reference', icon: 'flash' as const, tone: 'secondary' as const },
  wiki:  { label: 'Concepts',      icon: 'bulb' as const,  tone: 'tertiary'  as const },
};

export default function WikiScreen() {
  const { Colors } = useThemeMode();

  const [pages, setPages] = useState<WikiPage[]>([]);
  const [search, setSearch] = useState('');
  const [genTopic, setGenTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [openTitle, setOpenTitle] = useState<string>('');
  const [openBody, setOpenBody] = useState<string | null>(null);

  useEffect(() => { isApiConfigured().then(setConfigured); }, []);

  async function refresh() {
    if (!configured) return;
    try {
      const r = await apiListWiki();
      setPages(
        (r.pages ?? []).map((p: WikiPageSummary) => ({
          slug: p.slug,
          title: p.title,
          category: pickCategory(p.tags, p.title),
          excerpt: p.preview,
          updatedRelative: relTime(p.updated_at),
        })),
      );
    } catch { /* keep empty */ }
  }

  useEffect(() => { refresh(); }, [configured]);

  async function generate() {
    const topic = genTopic.trim();
    if (!topic) return;
    if (!configured) {
      Alert.alert('Connect cortex-api', 'Configure your connection in Settings.');
      return;
    }
    setGenerating(true);
    try {
      const r = await apiGenerateWiki(topic);
      setGenTopic('');
      setOpenSlug(r.slug); setOpenTitle(r.title); setOpenBody(r.body);
      refresh();
    } catch (e) {
      Alert.alert('Generation failed', String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function open(p: WikiPage) {
    setOpenSlug(p.slug); setOpenTitle(p.title); setOpenBody(null);
    if (!configured) return;
    try {
      const full = await apiGetWiki(p.slug);
      setOpenBody(full.body);
    } catch { setOpenBody('(failed to load page)'); }
  }

  const visible = pages.filter(
    (p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Header title="Wiki" eyebrow="07 · document" back />

      <Screen padding={Spacing.md}>
        <Card variant="primary" size="hero" padding="lg" style={{ marginBottom: Spacing.md }}>
          <Text style={[Typography.codeSm, { color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase' }]}>
            document.
          </Text>
          <Text style={[Typography.h2, { color: Colors.onPrimaryFixed, marginTop: 4, letterSpacing: -0.5 }]}>
            Auto-wiki, sourced from your diary.
          </Text>
          <Text style={[Typography.bodySm, { color: Colors.onPrimaryFixed, opacity: 0.8, marginTop: Spacing.sm }]}>
            Granite reads diary entries + indexed code and writes a markdown page to docs/wiki/<slug>.md.
          </Text>
        </Card>

        {/* Search */}
        <View
          style={[
            s.searchBar,
            { backgroundColor: Colors.surfaceContainer, borderColor: Colors.outlineVariant },
          ]}
        >
          <Ionicons name="search" size={16} color={Colors.outline} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Find a page…"
            placeholderTextColor={Colors.outline}
            style={[s.searchInput, { color: Colors.onSurface }]}
          />
        </View>

        {/* Pages */}
        <Section title="Pages" trailingLabel={configured ? 'Refresh' : undefined} onTrailingPress={configured ? refresh : undefined}>
          {!configured ? (
            <EmptyState icon="cloud-offline-outline" title="Connect cortex-api" body="Wiki lives on the API." tone="primary" />
          ) : visible.length === 0 ? (
            <EmptyState
              icon="library-outline"
              title="No pages yet"
              body="Generate one below — Cortex will write it from your diary."
              tone="secondary"
            />
          ) : (
            visible.map((p) => {
              const c = CATEGORY[p.category];
              return (
                <Card key={p.slug} variant="surface" size="list" padding="md" onPress={() => open(p)}>
                  <View style={s.row}>
                    <Pill label={c.label} tone={c.tone} icon={c.icon} />
                    <Text style={[Typography.codeSm, { color: Colors.outline }]}>
                      {p.updatedRelative}
                    </Text>
                  </View>
                  <Text style={[Typography.label, { color: Colors.onSurface, marginTop: 6 }]} numberOfLines={1}>
                    {p.title}
                  </Text>
                  <Text style={[Typography.bodySm, { color: Colors.onSurfaceVariant, marginTop: 2 }]} numberOfLines={2}>
                    {p.excerpt}
                  </Text>
                </Card>
              );
            })
          )}
        </Section>

        {/* Generate */}
        <Section title="Generate with Granite">
          <Card variant="secondary" size="hero" padding="lg">
            <TextInput
              value={genTopic}
              onChangeText={setGenTopic}
              placeholder="Topic — e.g. authentication architecture"
              placeholderTextColor={Colors.outline}
              style={[s.genInput, { backgroundColor: Colors.surfaceContainerLowest, color: Colors.onSurface }]}
            />
            <Button
              label={generating ? 'Generating…' : 'Generate'}
              icon="sparkles"
              onPress={generate}
              loading={generating}
              variant="primary"
              fullWidth
              style={{ marginTop: Spacing.sm }}
            />
          </Card>
        </Section>
      </Screen>

      {/* Page reader modal */}
      <Modal visible={!!openSlug} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpenSlug(null)}>
        <Header
          title={openTitle || openSlug || 'Page'}
          right={<IconButton icon="close" size="sm" onPress={() => setOpenSlug(null)} />}
        />
        <Screen padding={Spacing.md}>
          {openBody == null ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Card variant="surface" padding="lg">
              <Text style={[Typography.body, { color: Colors.onSurface }]}>{openBody}</Text>
            </Card>
          )}
        </Screen>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.input, borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, ...Typography.body, paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  genInput: {
    padding: Spacing.md,
    borderRadius: Radius.input,
    ...Typography.body,
  },
});
