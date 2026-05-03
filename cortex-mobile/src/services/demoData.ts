/**
 * Demo data — complete dataset for all features.
 */

export interface DemoEntry {
  id: number; text: string; score: number;
  source: 'bob' | 'telegram-text' | 'web' | 'mobile';
  kind: 'note' | 'idea' | 'debug' | 'decision' | 'fix' | 'task' | 'report' | 'wellness' | 'insight' | 'snippet';
  repo?: string; file?: string; line_start?: number; tags: string[]; created_at: number;
}

export interface DemoCalendarEvent {
  id: string; title: string; date: string; time: string; endTime: string;
  type: 'meeting' | 'focus' | 'deadline' | 'break' | 'reminder' | 'review';
  description: string; attendees: string[]; location: string; completed: boolean; color: string;
}

export interface DemoSkill {
  id: string; name: string; description: string; trigger: string;
  actions: string[]; enabled: boolean; usageCount: number; lastUsed: number; category: string;
}

export interface DemoScheduledTask {
  id: string; title: string; description: string; scheduledAt: number;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly'; priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'done' | 'failed'; category: string; tags: string[];
}

// ─── Entries ─────────────────────────────────────────────────────────────────

const REPOS = ['cortex-ai/core', 'ibm/watsonx-platform', 'facebook/react', 'microsoft/typescript'];
const FILES = ['src/api/client.ts', 'src/components/Dashboard.tsx', 'backend/models.py', 'lib/utils/format.ts'];
const TAGS = ['architecture', 'performance', 'security', 'api-design', 'database', 'testing', 'refactor', 'bug-fix', 'feature', 'ai-ml', 'devops', 'mobile'];

const IDEAS = [
  'Implement real-time collaboration using WebSockets for instant sync across devices',
  'Use graph database for relationship mapping — could dramatically improve query performance',
  'AI-powered code review assistant that learns from team patterns and suggests improvements',
  'Micro-frontend architecture to scale the team — each feature as an independent deployable unit',
  'Feature flags with gradual rollout — reduce deployment risk and enable A/B testing',
  'Voice-driven code navigation using natural language — "show me where we handle auth"',
  'Semantic search across all documentation, code comments, and Slack history',
  'Automated dependency vulnerability scanner integrated into CI/CD pipeline',
];
const NOTES = [
  'Team standup: Discussed the new authentication flow. Need to review OAuth2 implementation by Friday.',
  'Client meeting went well. They want the dashboard redesign prioritized for Q2 launch.',
  'Code review revealed potential memory leak in the data processing pipeline. Investigating.',
  'Performance testing shows 40% improvement after implementing caching layer. Ready for production.',
  'Security audit identified 3 medium-priority vulnerabilities. Created tickets for remediation.',
  'Sprint retrospective: Team velocity up 15%. Continuous integration pipeline is working great.',
  'Architecture review: Decided to split monolith into 3 core services. Starting with auth service.',
  'Production incident post-mortem: Database connection pool exhaustion. Implemented better monitoring.',
];
const DEBUGS = [
  'Race condition in async handler causing intermittent 500 errors. Added mutex lock to serialize access.',
  'Memory leak traced to unclosed database connections. Implemented connection pooling with proper cleanup.',
  'CORS issue blocking API calls from new domain. Updated whitelist in nginx configuration.',
  'Performance bottleneck in N+1 query pattern. Refactored to use eager loading with joins.',
  'WebSocket connection dropping after 60 seconds. Implemented heartbeat ping/pong mechanism.',
  'React component re-rendering 100+ times per second. Memoized expensive calculations with useMemo.',
];
const DECISIONS = [
  'Chose PostgreSQL over MongoDB for primary database — ACID compliance critical for financial data',
  'Decided to use React over Vue for frontend — larger ecosystem and team expertise',
  'Going with microservices architecture instead of monolith — enables independent scaling',
  'Selected TypeScript for type safety — reduces runtime errors and improves developer experience',
  'Implementing JWT for authentication — stateless and scales horizontally',
  'Chose GitHub Actions over Jenkins for CI/CD — better integration and easier maintenance',
];
const FIXES = [
  'Fixed authentication bug where tokens weren\'t being refreshed properly. Users can now stay logged in.',
  'Resolved UI glitch in mobile view where buttons were overlapping. Adjusted flexbox layout.',
  'Patched security vulnerability in file upload — now properly validating file types and sizes.',
  'Fixed data synchronization issue between frontend and backend. State management now consistent.',
  'Corrected timezone handling bug that was showing wrong timestamps for international users.',
  'Resolved memory leak in event listeners. Now properly cleaning up on component unmount.',
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }

function makeEntry(id: number, daysAgo: number, kind?: string): DemoEntry {
  const k = kind || pick(['note', 'idea', 'debug', 'decision', 'fix', 'note', 'note']);
  const textMap: Record<string, string[]> = { idea: IDEAS, debug: DEBUGS, decision: DECISIONS, fix: FIXES };
  const text = pick(textMap[k] ?? NOTES);
  const created = Date.now() - daysAgo * 86400000 - Math.random() * 86400000;
  return {
    id, text, score: 0.5 + Math.random() * 0.5,
    source: pick(['bob', 'web', 'mobile', 'telegram-text']),
    kind: k as any,
    repo: Math.random() > 0.4 ? pick(REPOS) : undefined,
    file: Math.random() > 0.5 ? pick(FILES) : undefined,
    line_start: Math.random() > 0.6 ? Math.floor(Math.random() * 400) + 1 : undefined,
    tags: Math.random() > 0.3 ? pickN(TAGS, Math.floor(Math.random() * 3) + 1) : [],
    created_at: created,
  };
}

export function getDemoEntries(count = 50): DemoEntry[] {
  return Array.from({ length: count }, (_, i) => makeEntry(i + 1, Math.floor((i / count) * 30)))
    .sort((a, b) => b.created_at - a.created_at);
}
export function getDemoIdeas(count = 15): DemoEntry[] {
  return Array.from({ length: count }, (_, i) => makeEntry(i + 100, Math.floor(Math.random() * 14), 'idea'))
    .sort((a, b) => b.created_at - a.created_at);
}
export function getDemoProfile() {
  return { name: 'Alex Chen', handle: 'alexchen', bio: 'Senior Software Architect | Building AI-powered development tools', pronouns: 'they/them', timezone: 'America/Los_Angeles', public_url: 'https://alexchen.dev' };
}
export function getDemoWellness() {
  const mins = Math.floor(Math.random() * 120);
  return { minutes_since_break: mins, break_due: mins > 90, last_break_at: Date.now() - mins * 60000, breaks_today: Math.floor(Math.random() * 5) + 1 };
}
export function getDemoGitHub(days: number) {
  const contributions = Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    return { date: d.toISOString().slice(0, 10), count: Math.floor(Math.random() * 12) };
  });
  let streak = 0;
  for (let i = contributions.length - 1; i >= 0; i--) { if (contributions[i].count > 0) streak++; else break; }
  return { user: 'demo', days, contributions, streak };
}
export function getDemoAnalytics(window = 90) {
  return { window_minutes: window, total: 23, by_kind: { note: 8, idea: 5, debug: 4, fix: 3, decision: 3 }, by_source: { bob: 10, web: 8, mobile: 5 }, files_touched: ['src/api/client.ts', 'backend/models.py', 'src/components/Dashboard.tsx'] };
}
export function getDemoReport(days: number) {
  const entries = getDemoEntries(days * 3).slice(0, days * 3);
  const by_kind: Record<string, number> = {};
  entries.forEach(e => { by_kind[e.kind] = (by_kind[e.kind] ?? 0) + 1; });
  return { date_start: Date.now() - days * 86400000, date_end: Date.now(), total_entries: entries.length, by_kind, highlights: entries.slice(0, 10) };
}
export function getDemoTasks() {
  const now = Date.now();
  return [
    { id: 1, title: 'Review pull request #234', priority: 'high', category: 'review', completed: false, due: now + 2 * 3600000 },
    { id: 2, title: 'Fix production bug in payment flow', priority: 'critical', category: 'bug', completed: false, due: now + 3600000 },
    { id: 3, title: 'Update API documentation', priority: 'medium', category: 'docs', completed: false, due: now + 86400000 },
    { id: 4, title: 'Refactor database queries', priority: 'medium', category: 'refactor', completed: false, due: now + 3 * 86400000 },
    { id: 5, title: 'Write unit tests for auth module', priority: 'medium', category: 'testing', completed: true, due: now - 86400000 },
    { id: 6, title: 'Update dependencies', priority: 'high', category: 'security', completed: false, due: now + 6 * 3600000 },
  ];
}
export function getDemoNotifications() {
  const now = Date.now();
  return [
    { id: 1, title: 'Pull Request Approved', message: 'PR #234 approved by 2 reviewers', type: 'success', read: false, created_at: now - 5 * 60000 },
    { id: 2, title: 'Build Failed', message: 'CI/CD pipeline failed for feature/new-dashboard', type: 'error', read: false, created_at: now - 15 * 60000 },
    { id: 3, title: 'Security Alert', message: '3 high-severity vulnerabilities found in dependencies', type: 'warning', read: false, created_at: now - 30 * 60000 },
    { id: 4, title: 'Deployment Successful', message: 'Version 2.4.1 deployed to production', type: 'success', read: true, created_at: now - 2 * 3600000 },
    { id: 5, title: 'Code Review Requested', message: 'Sarah Chen requested your review on PR #245', type: 'info', read: true, created_at: now - 3600000 },
  ];
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export function getDemoCalendarEvents(): DemoCalendarEvent[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  return [
    { id: '1', title: 'Daily Standup', date: fmt(today), time: '09:00', endTime: '09:15', type: 'meeting', description: 'Team sync — 15 minutes', attendees: ['team@company.com'], location: 'Zoom', completed: false, color: '#0f62fe' },
    { id: '2', title: 'Deep Work: Feature Implementation', date: fmt(today), time: '10:00', endTime: '12:00', type: 'focus', description: 'Focus time for new dashboard feature', attendees: [], location: 'Do Not Disturb', completed: false, color: '#198038' },
    { id: '3', title: 'Code Review Session', date: fmt(today), time: '14:00', endTime: '15:00', type: 'review', description: 'Review PRs with senior dev', attendees: ['senior-dev@company.com'], location: 'Virtual', completed: false, color: '#8a3ffc' },
    { id: '4', title: 'Sprint Planning Deadline', date: fmt(today), time: '17:00', endTime: '17:00', type: 'deadline', description: 'Sprint planning must be complete', attendees: [], location: '', completed: false, color: '#da1e28' },
    { id: '5', title: 'Coffee Break', date: fmt(today), time: '12:00', endTime: '12:15', type: 'break', description: 'Step away from screen', attendees: [], location: 'Kitchen', completed: true, color: '#f1c21b' },
    { id: '6', title: 'Client Demo', date: fmt(tomorrow), time: '11:00', endTime: '12:00', type: 'meeting', description: 'Showcase new dashboard features to client', attendees: ['client@external.com', 'sales@company.com'], location: 'Google Meet', completed: false, color: '#0f62fe' },
    { id: '7', title: 'Architecture Review', date: fmt(tomorrow), time: '15:00', endTime: '16:30', type: 'meeting', description: 'Discuss microservices migration plan', attendees: ['architects@company.com'], location: 'Conference Room B', completed: false, color: '#8a3ffc' },
    { id: '8', title: '1-on-1 with Manager', date: fmt(dayAfter), time: '16:00', endTime: '16:30', type: 'meeting', description: 'Weekly sync and career discussion', attendees: ['manager@company.com'], location: 'Private Office', completed: false, color: '#0f62fe' },
    { id: '9', title: 'Security Audit Review', date: fmt(yesterday), time: '10:00', endTime: '11:00', type: 'review', description: 'Review security findings from last week', attendees: ['security@company.com'], location: 'Virtual', completed: true, color: '#da1e28' },
    { id: '10', title: 'Deployment Window', date: fmt(dayAfter), time: '22:00', endTime: '23:00', type: 'deadline', description: 'Production deployment for v2.5.0', attendees: ['devops@company.com'], location: 'Remote', completed: false, color: '#da1e28' },
  ];
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export function getDemoSkills(): DemoSkill[] {
  const now = Date.now();
  return [
    { id: 's1', name: 'Auto Bug Reporter', description: 'When a debug entry is saved, automatically format and log it as a structured bug report with severity, steps to reproduce, and affected files.', trigger: 'on_entry_kind:debug', actions: ['format_bug_report', 'save_to_journal', 'notify_team'], enabled: true, usageCount: 23, lastUsed: now - 2 * 3600000, category: 'debugging' },
    { id: 's2', name: 'Decision Documenter', description: 'Captures architectural decisions with context, alternatives considered, and rationale. Automatically links to related code files.', trigger: 'on_entry_kind:decision', actions: ['extract_context', 'link_code_files', 'create_adr'], enabled: true, usageCount: 15, lastUsed: now - 86400000, category: 'documentation' },
    { id: 's3', name: 'Daily Standup Generator', description: 'At 9 AM each day, summarizes yesterday\'s entries and generates a standup update ready to paste into Slack.', trigger: 'schedule:09:00', actions: ['summarize_yesterday', 'format_standup', 'copy_to_clipboard'], enabled: true, usageCount: 47, lastUsed: now - 18 * 3600000, category: 'productivity' },
    { id: 's4', name: 'Code Pattern Extractor', description: 'When a snippet entry is saved, extracts reusable patterns and adds them to your personal code library with tags.', trigger: 'on_entry_kind:snippet', actions: ['extract_pattern', 'tag_automatically', 'add_to_library'], enabled: false, usageCount: 8, lastUsed: now - 7 * 86400000, category: 'code' },
    { id: 's5', name: 'Security Scanner', description: 'Scans all new entries for potential secrets, API keys, or sensitive data before saving. Blocks and alerts on detection.', trigger: 'before_save', actions: ['scan_secrets', 'check_entropy', 'block_if_found'], enabled: true, usageCount: 156, lastUsed: now - 30 * 60000, category: 'security' },
    { id: 's6', name: 'Weekly Knowledge Digest', description: 'Every Friday at 5 PM, generates a digest of the week\'s learnings, decisions, and fixes with links to related entries.', trigger: 'schedule:friday:17:00', actions: ['collect_week_entries', 'generate_digest', 'email_summary'], enabled: true, usageCount: 12, lastUsed: now - 3 * 86400000, category: 'reporting' },
  ];
}

// ─── Scheduled Tasks ──────────────────────────────────────────────────────────

export function getDemoScheduledTasks(): DemoScheduledTask[] {
  const now = Date.now();
  return [
    { id: 't1', title: 'Daily Standup Summary', description: 'Generate and post standup update to Slack #dev-team', scheduledAt: now + 2 * 3600000, recurrence: 'daily', priority: 'high', status: 'pending', category: 'communication', tags: ['standup', 'slack', 'daily'] },
    { id: 't2', title: 'Security Dependency Scan', description: 'Run npm audit and pip-audit, create entries for any critical CVEs found', scheduledAt: now + 6 * 3600000, recurrence: 'weekly', priority: 'critical', status: 'pending', category: 'security', tags: ['security', 'dependencies', 'audit'] },
    { id: 't3', title: 'Weekly Knowledge Digest', description: 'Summarize week\'s learnings and send digest email', scheduledAt: now + 2 * 86400000, recurrence: 'weekly', priority: 'medium', status: 'pending', category: 'reporting', tags: ['digest', 'weekly', 'learning'] },
    { id: 't4', title: 'Database Backup Verification', description: 'Verify cortex.db backup integrity and log result', scheduledAt: now - 3600000, recurrence: 'daily', priority: 'high', status: 'done', category: 'maintenance', tags: ['backup', 'database', 'maintenance'] },
    { id: 't5', title: 'Code Review Reminder', description: 'Check for open PRs older than 24h and create task entries', scheduledAt: now + 3600000, recurrence: 'daily', priority: 'medium', status: 'pending', category: 'code-review', tags: ['pr', 'review', 'github'] },
    { id: 't6', title: 'Monthly ROI Report', description: 'Calculate and log productivity metrics and time saved using Cortex', scheduledAt: now + 7 * 86400000, recurrence: 'monthly', priority: 'low', status: 'pending', category: 'reporting', tags: ['roi', 'metrics', 'monthly'] },
    { id: 't7', title: 'Sync Bob Session Reports', description: 'Export Bob session reports to docs/bob-sessions/', scheduledAt: now - 86400000, recurrence: 'weekly', priority: 'high', status: 'failed', category: 'bob', tags: ['bob', 'sessions', 'export'] },
  ];
}

// ─── Bob Skills ───────────────────────────────────────────────────────────────

export function getDemoBobSkills() {
  return [
    { id: 'b1', name: 'diary_save', description: 'Save a developer journal entry with secret detection', category: 'capture', icon: 'save-outline', color: '#0f62fe', lastInvoked: Date.now() - 30 * 60000, invokeCount: 47 },
    { id: 'b2', name: 'diary_recall', description: 'Search journal for entries relevant to a topic', category: 'recall', icon: 'search-outline', color: '#198038', lastInvoked: Date.now() - 2 * 3600000, invokeCount: 89 },
    { id: 'b3', name: 'diary_timeline', description: 'Show most recent journal entries', category: 'recall', icon: 'time-outline', color: '#8a3ffc', lastInvoked: Date.now() - 86400000, invokeCount: 23 },
    { id: 'b4', name: 'diary_feedback', description: 'Boost or flag a recalled entry to shape future ranking', category: 'learning', icon: 'thumbs-up-outline', color: '#f1c21b', lastInvoked: Date.now() - 3 * 86400000, invokeCount: 12 },
    { id: 'b5', name: 'diary_link_code', description: 'Attach repo/file:line metadata to an existing entry', category: 'capture', icon: 'code-slash-outline', color: '#da1e28', lastInvoked: Date.now() - 7 * 86400000, invokeCount: 8 },
  ];
}
