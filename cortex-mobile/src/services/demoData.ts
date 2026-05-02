/**
 * Demo data for the mobile app — mirrors web app's dummyData.ts
 * Used when API is not configured or returns empty results.
 */

export interface DemoEntry {
  id: number;
  text: string;
  score: number;
  source: 'bob' | 'telegram-text' | 'web' | 'mobile';
  kind: 'note' | 'idea' | 'debug' | 'decision' | 'fix' | 'task' | 'report' | 'wellness' | 'insight' | 'snippet';
  repo?: string;
  file?: string;
  line_start?: number;
  tags: string[];
  created_at: number;
}

const REPOS = ['cortex-ai/core', 'ibm/watsonx-platform', 'facebook/react', 'microsoft/typescript', 'vercel/next.js'];
const FILES = ['src/api/client.ts', 'src/components/Dashboard.tsx', 'backend/models.py', 'lib/utils/format.ts', 'src/hooks/useWebSocket.ts'];
const TAGS = ['architecture', 'performance', 'security', 'api-design', 'database', 'testing', 'refactor', 'bug-fix', 'feature', 'ai-ml', 'devops', 'mobile'];

const IDEAS = [
  'Implement real-time collaboration using WebSockets for instant sync across devices',
  'Use graph database for relationship mapping — could dramatically improve query performance',
  'AI-powered code review assistant that learns from team patterns and suggests improvements',
  'Micro-frontend architecture to scale the team — each feature as an independent deployable unit',
  'Progressive web app features for offline-first experience — critical for mobile users',
  'Use WebAssembly for compute-intensive operations — could get 10x performance boost',
  'Feature flags with gradual rollout — reduce deployment risk and enable A/B testing',
  'GraphQL federation for microservices — single unified API gateway with distributed schema',
  'Voice-driven code navigation using natural language — "show me where we handle auth"',
  'Semantic search across all documentation, code comments, and Slack history',
];

const NOTES = [
  'Team standup: Discussed the new authentication flow. Need to review OAuth2 implementation by Friday.',
  'Client meeting went well. They want the dashboard redesign prioritized for Q2 launch.',
  'Code review revealed potential memory leak in the data processing pipeline. Investigating.',
  'Performance testing shows 40% improvement after implementing caching layer. Ready for production.',
  'Security audit identified 3 medium-priority vulnerabilities. Created tickets for remediation.',
  'Pair programming session on the new API endpoints. Learned some great TypeScript patterns.',
  'Database migration completed successfully. All indexes rebuilt, query performance improved.',
  'Sprint retrospective: Team velocity up 15%. Continuous integration pipeline is working great.',
  'Architecture review: Decided to split monolith into 3 core services. Starting with auth service.',
  'Production incident post-mortem: Database connection pool exhaustion. Implemented better monitoring.',
];

const DEBUGS = [
  'Race condition in async handler causing intermittent 500 errors. Added mutex lock to serialize access.',
  'Memory leak traced to unclosed database connections. Implemented connection pooling with proper cleanup.',
  'CORS issue blocking API calls from new domain. Updated whitelist in nginx configuration.',
  'Infinite loop in recursive function when handling circular references. Added visited set.',
  'Performance bottleneck in N+1 query pattern. Refactored to use eager loading with joins.',
  'WebSocket connection dropping after 60 seconds. Implemented heartbeat ping/pong mechanism.',
  'React component re-rendering 100+ times per second. Memoized expensive calculations with useMemo.',
  'Database deadlock during high concurrency. Reordered transaction operations to prevent lock cycles.',
];

const DECISIONS = [
  'Chose PostgreSQL over MongoDB for primary database — ACID compliance critical for financial data',
  'Decided to use React over Vue for frontend — larger ecosystem and team expertise',
  'Going with microservices architecture instead of monolith — enables independent scaling',
  'Selected TypeScript for type safety — reduces runtime errors and improves developer experience',
  'Implementing JWT for authentication — stateless and scales horizontally',
  'Using Docker for containerization — consistent environments across dev/staging/prod',
  'Chose GitHub Actions over Jenkins for CI/CD — better integration and easier maintenance',
  'Selected Redis for caching layer — proven performance and rich data structures',
];

const FIXES = [
  'Fixed authentication bug where tokens weren\'t being refreshed properly. Users can now stay logged in.',
  'Resolved UI glitch in mobile view where buttons were overlapping. Adjusted flexbox layout.',
  'Patched security vulnerability in file upload — now properly validating file types and sizes.',
  'Fixed data synchronization issue between frontend and backend. State management now consistent.',
  'Corrected timezone handling bug that was showing wrong timestamps for international users.',
  'Resolved memory leak in event listeners. Now properly cleaning up on component unmount.',
  'Fixed broken pagination on search results. Edge cases now handled correctly.',
  'Patched race condition in payment processing. Transactions now properly serialized.',
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }

function makeEntry(id: number, daysAgo: number, kind?: string): DemoEntry {
  const k = kind || pick(['note', 'idea', 'debug', 'decision', 'fix', 'note', 'note']);
  const textMap: Record<string, string[]> = { idea: IDEAS, debug: DEBUGS, decision: DECISIONS, fix: FIXES };
  const text = pick(textMap[k] ?? NOTES);
  const created = Date.now() - daysAgo * 86400000 - Math.random() * 86400000;
  return {
    id,
    text,
    score: 0.5 + Math.random() * 0.5,
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
  return {
    name: 'Alex Chen',
    handle: 'alexchen',
    bio: 'Senior Software Architect | Building AI-powered development tools',
    pronouns: 'they/them',
    timezone: 'America/Los_Angeles',
    public_url: 'https://alexchen.dev',
  };
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
  for (let i = contributions.length - 1; i >= 0; i--) {
    if (contributions[i].count > 0) streak++; else break;
  }
  return { user: 'demo', days, contributions, streak };
}

export function getDemoAnalytics(window = 90) {
  return {
    window_minutes: window,
    total: 23,
    by_kind: { note: 8, idea: 5, debug: 4, fix: 3, decision: 3 },
    by_source: { bob: 10, web: 8, mobile: 5 },
    files_touched: ['src/api/client.ts', 'backend/models.py', 'src/components/Dashboard.tsx'],
  };
}

export function getDemoReport(days: number) {
  const entries = getDemoEntries(days * 3).slice(0, days * 3);
  const by_kind: Record<string, number> = {};
  entries.forEach(e => { by_kind[e.kind] = (by_kind[e.kind] ?? 0) + 1; });
  return {
    date_start: Date.now() - days * 86400000,
    date_end: Date.now(),
    total_entries: entries.length,
    by_kind,
    highlights: entries.slice(0, 10),
  };
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
