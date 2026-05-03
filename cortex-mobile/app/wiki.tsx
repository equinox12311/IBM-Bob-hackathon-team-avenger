// Wiki — auto-generated docs/ pages, browsed and regenerated from Granite.
// Maps to the "Docs & Resources" mockup in theme.md (lines 1-293).

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT } from "../src/constants/layout";
import { Colors, Radius, Shadow, Spacing, Typography } from "../src/constants/theme";

interface WikiPage {
  slug: string;
  title: string;
  category: "guide" | "api" | "wiki";
  excerpt: string;
  updatedRelative: string;
}

// Demo data until /api/v1/wiki lands.
const DEMO_PAGES: WikiPage[] = [
  {
    slug: "auth-architecture",
    title: "Authentication architecture",
    category: "wiki",
    excerpt: "How AuthProvider hoists token state into context for the whole tree, and why hook-local state silently broke logins in v0.1.",
    updatedRelative: "2 hours ago",
  },
  {
    slug: "post-entries",
    title: "POST /api/v1/entries",
    category: "api",
    excerpt: "Save a journal entry. Body: text, source, kind?, repo?, file?, line_start?, line_end?, tags?",
    updatedRelative: "yesterday",
  },
  {
    slug: "docker-deployment",
    title: "Docker deployment",
    category: "guide",
    excerpt: "Three services (api:8080 · web:8081 · bot) wired by docker-compose. Volumes preserve the SQLite + sqlite-vec store.",
    updatedRelative: "3 days ago",
  },
];

const CATEGORY_META = {
  guide: { label: "README & Guides",   icon: "book",          tint: { bg: Colors.primaryFixed,   fg: Colors.primary,   shadow: Shadow.cardPrimary } },
  api:   { label: "API Reference",     icon: "flash",         tint: { bg: Colors.secondaryFixed, fg: Colors.secondary, shadow: Shadow.cardSecondary } },
  wiki:  { label: "Wiki & Concepts",   icon: "bulb",          tint: { bg: Colors.tertiaryFixed,  fg: Colors.tertiary,  shadow: Shadow.card } },
} as const;

export default function WikiScreen() {
  const [search, setSearch] = useState("");
  const [genTopic, setGenTopic] = useState("");

  const visible = DEMO_PAGES.filter(
    (p) =>
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Ionicons name="library" size={22} color={Colors.primary} />
        <Text style={styles.headerTitle}>Docs & Resources</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero search */}
        <View style={styles.hero}>
          <Text style={styles.heroH1}>How can I help you build today?</Text>
          <Text style={styles.heroSub}>
            Search documentation, API references, and community guides.
          </Text>
          <View style={styles.searchWrap}>
            <Ionicons
              name="search"
              size={20}
              color={Colors.primary}
              style={{ marginLeft: Spacing.md }}
            />
            <TextInput
              style={styles.search}
              placeholder="Ask Bob…"
              placeholderTextColor={Colors.outline}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <View style={styles.chips}>
            {(["guide", "api", "wiki"] as const).map((k) => (
              <TouchableOpacity
                key={k}
                style={[styles.chip, { backgroundColor: CATEGORY_META[k].tint.bg }]}
                onPress={() => setSearch(CATEGORY_META[k].label)}
              >
                <Text
                  style={[styles.chipText, { color: CATEGORY_META[k].tint.fg }]}
                >
                  {CATEGORY_META[k].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bento grid */}
        <View style={styles.bento}>
          {(["guide", "api", "wiki"] as const).map((k) => {
            const m = CATEGORY_META[k];
            const count = DEMO_PAGES.filter((p) => p.category === k).length;
            return (
              <View key={k} style={[styles.bentoCard, m.tint.shadow]}>
                <View
                  style={[
                    styles.bentoIcon,
                    { backgroundColor: m.tint.bg },
                  ]}
                >
                  <Ionicons name={m.icon as any} size={24} color={m.tint.fg} />
                </View>
                <Text style={styles.bentoTitle}>{m.label}</Text>
                <Text style={styles.bentoSub}>{count} pages</Text>
              </View>
            );
          })}
        </View>

        {/* Recently viewed */}
        <View style={styles.recent}>
          <Text style={styles.recentTitle}>Recently viewed</Text>
          {visible.map((p) => {
            const m = CATEGORY_META[p.category];
            return (
              <TouchableOpacity key={p.slug} style={styles.recentItem}>
                <Ionicons name={m.icon as any} size={20} color={Colors.outline} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentItemTitle}>{p.title}</Text>
                  <Text style={styles.recentItemPath}>
                    {m.label} · {p.excerpt.slice(0, 60)}…
                  </Text>
                </View>
                <Text style={styles.recentItemTime}>{p.updatedRelative}</Text>
              </TouchableOpacity>
            );
          })}
          {visible.length === 0 && (
            <Text style={styles.empty}>
              No matching pages. Try generating one below.
            </Text>
          )}
        </View>

        {/* Generate panel */}
        <View style={styles.gen}>
          <Text style={styles.genTitle}>
            Generate a doc with Granite
          </Text>
          <Text style={styles.genSub}>
            Granite reads diary entries + indexed code and writes a markdown page to <Text style={styles.genCode}>docs/wiki/&lt;slug&gt;.md</Text>.
          </Text>
          <TextInput
            style={styles.genInput}
            placeholder="Topic — e.g. authentication architecture"
            placeholderTextColor={Colors.outline}
            value={genTopic}
            onChangeText={setGenTopic}
          />
          <TouchableOpacity
            style={[styles.genBtn, !genTopic.trim() && { opacity: 0.4 }]}
            disabled={!genTopic.trim()}
          >
            <Ionicons name="sparkles" size={16} color={Colors.onPrimary} />
            <Text style={styles.genBtnText}>Generate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  headerTitle: { ...Typography.heading, color: Colors.onSurface },

  content: {
    paddingBottom: TAB_BAR_HEIGHT + Spacing.xl,
  },

  hero: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  heroH1: { ...Typography.h2, color: Colors.onSurface, textAlign: "center" },
  heroSub: { ...Typography.bodyLg, color: Colors.onSurfaceVariant, textAlign: "center" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.input,
    borderWidth: 2,
    borderColor: Colors.primaryFixed,
    ...Shadow.card,
  },
  search: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.bodyLg,
    color: Colors.onSurface,
  },
  chips: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.chip,
  },
  chipText: { ...Typography.labelSm },

  bento: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    flexWrap: "wrap",
    marginBottom: Spacing.lg,
  },
  bentoCard: {
    flex: 1,
    minWidth: 150,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    gap: Spacing.sm,
  },
  bentoIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  bentoTitle: { ...Typography.h3, color: Colors.onSurface },
  bentoSub: { ...Typography.bodySm, color: Colors.onSurfaceVariant },

  recent: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    marginBottom: Spacing.lg,
  },
  recentTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  recentItemTitle: { ...Typography.label, color: Colors.onSurface },
  recentItemPath: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 2 },
  recentItemTime: { ...Typography.codeSm, color: Colors.outline },
  empty: { ...Typography.bodySm, color: Colors.onSurfaceVariant, padding: Spacing.md },

  gen: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    gap: Spacing.sm,
    ...Shadow.cardSecondary,
  },
  genTitle: { ...Typography.h3, color: Colors.onSurface },
  genSub: { ...Typography.bodySm, color: Colors.onSurfaceVariant },
  genCode: { ...Typography.code, color: Colors.secondary },
  genInput: {
    padding: Spacing.md,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.input,
    ...Typography.body,
    color: Colors.onSurface,
  },
  genBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.input,
  },
  genBtnText: { ...Typography.label, color: Colors.onSecondary },
});
