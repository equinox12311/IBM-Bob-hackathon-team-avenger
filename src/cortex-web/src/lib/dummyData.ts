// Comprehensive dummy data generator for Cortex
// Provides realistic data for all features when backend is empty

export interface DummyEntry {
  id: number;
  text: string;
  score: number;
  source: "bob" | "telegram-text" | "telegram-voice" | "web";
  kind: "note" | "idea" | "debug" | "decision" | "fix" | "task" | "report" | "wellness" | "client";
  repo?: string;
  file?: string;
  line_start?: number;
  line_end?: number;
  tags?: string[];
  created_at: number;
}

const REPOS = [
  "cortex-ai/core",
  "ibm/watsonx-platform",
  "openai/gpt-models",
  "microsoft/typescript",
  "vercel/next.js",
  "facebook/react",
  "kubernetes/kubernetes",
  "tensorflow/tensorflow",
  "pytorch/pytorch",
  "apache/kafka",
  "elastic/elasticsearch",
  "hashicorp/terraform",
  "docker/docker",
  "grafana/grafana",
  "prometheus/prometheus"
];

const FILES = [
  "src/api/client.ts",
  "src/components/Dashboard.tsx",
  "backend/models.py",
  "lib/utils/format.ts",
  "config/database.yml",
  "tests/integration.spec.ts",
  "src/services/auth.service.ts",
  "infrastructure/k8s/deployment.yaml",
  "src/hooks/useWebSocket.ts",
  "backend/api/routes.py",
  "src/store/slices/userSlice.ts",
  "docker-compose.yml",
  "src/utils/encryption.ts",
  "backend/middleware/rate_limiter.py",
  "src/components/charts/MetricsChart.tsx"
];

const TAGS = [
  "architecture", "performance", "security", "ui-ux", "api-design",
  "database", "testing", "deployment", "refactor", "bug-fix",
  "feature", "optimization", "documentation", "review", "learning",
  "ai-ml", "devops", "cloud", "mobile", "accessibility",
  "scalability", "monitoring", "analytics", "compliance", "innovation"
];

const IDEA_TEMPLATES = [
  "What if we implemented a real-time collaboration feature using WebSockets for instant sync across devices?",
  "Consider using a graph database for relationship mapping - could dramatically improve query performance for connected data",
  "AI-powered code review assistant that learns from team patterns and suggests improvements proactively",
  "Micro-frontend architecture could help us scale the team - each feature as an independent deployable unit",
  "Implement progressive web app features for offline-first experience - critical for mobile users",
  "Use WebAssembly for compute-intensive operations - could get 10x performance boost on data processing",
  "Blockchain-based audit trail for compliance - immutable record of all system changes",
  "Implement feature flags with gradual rollout - reduce deployment risk and enable A/B testing",
  "GraphQL federation for microservices - single unified API gateway with distributed schema",
  "Edge computing for latency-sensitive operations - process data closer to users",
  "Voice-driven code navigation using natural language - 'show me where we handle user authentication'",
  "Automated dependency vulnerability scanner integrated into CI/CD - block PRs with critical CVEs",
  "Smart code completion using team's historical patterns - learns from our actual codebase",
  "Visual regression testing with AI-powered screenshot comparison - catches UI bugs automatically",
  "Distributed tracing across all microservices - full request journey visualization in one dashboard",
  "Auto-scaling based on ML predictions of traffic patterns - proactive instead of reactive",
  "Code ownership heat map showing who knows what - helps with knowledge transfer and onboarding",
  "Semantic search across all documentation, code comments, and Slack history - find answers instantly",
  "Automated API documentation generation from TypeScript types - always up-to-date specs",
  "Developer productivity analytics dashboard - identify bottlenecks in our workflow"
];

const NOTE_TEMPLATES = [
  "Team standup: Discussed the new authentication flow. Need to review OAuth2 implementation by Friday.",
  "Client meeting went well. They want the dashboard redesign prioritized for Q2 launch.",
  "Code review revealed potential memory leak in the data processing pipeline. Investigating with profiler.",
  "Performance testing shows 40% improvement after implementing caching layer. Ready for production.",
  "Security audit identified 3 medium-priority vulnerabilities. Created tickets for remediation.",
  "Pair programming session on the new API endpoints. Learned some great TypeScript patterns.",
  "Database migration completed successfully. All indexes rebuilt, query performance improved.",
  "User feedback session revealed confusion about the navigation. Planning UX improvements.",
  "Sprint retrospective: Team velocity up 15%. Continuous integration pipeline is working great.",
  "Technical debt review: Identified 5 areas for refactoring in the next sprint.",
  "Architecture review meeting: Decided to split monolith into 3 core services. Starting with auth service.",
  "Onboarding new team member Sarah - she has great experience with Kubernetes and observability tools.",
  "Production incident post-mortem: Database connection pool exhaustion. Implemented better monitoring.",
  "Lunch & learn session on WebAssembly - exploring use cases for our compute-heavy features.",
  "Customer success team reported 20% increase in feature adoption after UI redesign. Great win!",
  "Weekly 1-on-1 with manager: Discussed career growth path and potential tech lead role next quarter.",
  "Hackathon planning: Team excited about building AI-powered code review tool. Forming teams tomorrow.",
  "Open source contribution merged! Fixed bug in React Router that was affecting our navigation.",
  "Design system workshop: Established new component library standards. All teams adopting by end of month.",
  "Infrastructure cost review: Optimized cloud resources, saving $15K/month. Moving to spot instances."
];

const DEBUG_TEMPLATES = [
  "Race condition in async handler causing intermittent 500 errors. Added mutex lock to serialize access.",
  "Memory leak traced to unclosed database connections. Implemented connection pooling with proper cleanup.",
  "CORS issue blocking API calls from new domain. Updated whitelist in nginx configuration.",
  "Infinite loop in recursive function when handling circular references. Added visited set to track nodes.",
  "Null pointer exception in edge case when user has no profile data. Added defensive null checks.",
  "Performance bottleneck in N+1 query pattern. Refactored to use eager loading with joins.",
  "CSS z-index conflict causing modal to appear behind overlay. Restructured stacking context.",
  "WebSocket connection dropping after 60 seconds. Implemented heartbeat ping/pong mechanism.",
  "Type coercion bug in comparison operator. Switched to strict equality checks throughout.",
  "Cache invalidation not working correctly. Fixed cache key generation to include all dependencies.",
  "React component re-rendering 100+ times per second. Memoized expensive calculations with useMemo.",
  "API timeout on large dataset queries. Implemented cursor-based pagination and query optimization.",
  "Docker container running out of memory in production. Increased limits and added memory profiling.",
  "Flaky integration test failing randomly. Issue was shared test state - isolated test data properly.",
  "Mobile app crashing on iOS 14 devices. Problem was deprecated API usage - updated to new methods.",
  "Webpack build taking 5+ minutes. Configured parallel builds and optimized loader chain.",
  "Database deadlock during high concurrency. Reordered transaction operations to prevent lock cycles.",
  "Redux state updates not triggering re-renders. Fixed immutability violation in reducer logic.",
  "File upload failing for files >10MB. Chunked upload implementation with resume capability added.",
  "Authentication tokens expiring mid-request. Implemented token refresh interceptor in API client."
];

const DECISION_TEMPLATES = [
  "Chose PostgreSQL over MongoDB for primary database - ACID compliance critical for financial data",
  "Decided to use React over Vue for frontend - larger ecosystem and team expertise",
  "Going with microservices architecture instead of monolith - enables independent scaling",
  "Selected TypeScript for type safety - reduces runtime errors and improves developer experience",
  "Implementing JWT for authentication - stateless and scales horizontally",
  "Using Docker for containerization - consistent environments across dev/staging/prod",
  "Chose GitHub Actions over Jenkins for CI/CD - better integration and easier maintenance",
  "Going with REST API over GraphQL for v1 - simpler to implement and debug",
  "Selected Redis for caching layer - proven performance and rich data structures",
  "Using Terraform for infrastructure as code - declarative and cloud-agnostic",
  "Adopted trunk-based development over GitFlow - faster integration and simpler workflow",
  "Selected Kubernetes for orchestration - industry standard with strong ecosystem",
  "Chose Tailwind CSS over styled-components - utility-first approach speeds up development",
  "Implementing event sourcing for audit trail - complete history and easy debugging",
  "Selected Elasticsearch for search functionality - powerful full-text search capabilities",
  "Using Prometheus + Grafana for monitoring - open source and highly customizable",
  "Chose Next.js for SSR capabilities - better SEO and initial load performance",
  "Implementing OAuth 2.0 with PKCE - secure authentication for mobile apps",
  "Selected Kafka for event streaming - handles high throughput and provides durability",
  "Using Playwright over Selenium for E2E tests - faster, more reliable, better DX"
];

const FIX_TEMPLATES = [
  "Fixed authentication bug where tokens weren't being refreshed properly. Users can now stay logged in.",
  "Resolved UI glitch in mobile view where buttons were overlapping. Adjusted flexbox layout.",
  "Patched security vulnerability in file upload - now properly validating file types and sizes.",
  "Fixed data synchronization issue between frontend and backend. State management now consistent.",
  "Corrected timezone handling bug that was showing wrong timestamps for international users.",
  "Resolved memory leak in event listeners. Now properly cleaning up on component unmount.",
  "Fixed broken pagination on search results. Edge cases now handled correctly.",
  "Patched race condition in payment processing. Transactions now properly serialized.",
  "Resolved CSS specificity issue causing style conflicts. Refactored to use CSS modules.",
  "Fixed API rate limiting bug that was blocking legitimate requests. Adjusted threshold logic.",
  "Corrected email notification bug - HTML templates now render properly in all clients.",
  "Fixed infinite scroll not loading more items. Intersection observer now properly configured.",
  "Resolved HTTPS mixed content warnings. All resources now served over secure connections.",
  "Patched XSS vulnerability in user-generated content. Implemented proper sanitization.",
  "Fixed form validation not showing error messages. State updates now trigger re-renders.",
  "Corrected database migration rollback issue. Added proper down migration scripts.",
  "Resolved Docker image size bloat. Multi-stage builds reduced size by 60%.",
  "Fixed accessibility issue with keyboard navigation. All interactive elements now focusable.",
  "Patched memory leak in WebSocket connections. Properly closing connections on unmount.",
  "Corrected date picker showing wrong month. Timezone conversion logic fixed."
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateEntry(id: number, daysAgo: number, kind?: string): DummyEntry {
  const entryKind = kind || randomItem(["note", "idea", "debug", "decision", "fix", "task"]);
  let text = "";
  
  switch (entryKind) {
    case "idea":
      text = randomItem(IDEA_TEMPLATES);
      break;
    case "debug":
      text = randomItem(DEBUG_TEMPLATES);
      break;
    case "decision":
      text = randomItem(DECISION_TEMPLATES);
      break;
    case "fix":
      text = randomItem(FIX_TEMPLATES);
      break;
    default:
      text = randomItem(NOTE_TEMPLATES);
  }

  const now = Date.now();
  const created = now - (daysAgo * 24 * 60 * 60 * 1000) - (Math.random() * 24 * 60 * 60 * 1000);
  
  return {
    id,
    text,
    score: 0.5 + Math.random() * 0.5,
    source: randomItem(["bob", "web", "telegram-text"]),
    kind: entryKind as any,
    repo: Math.random() > 0.3 ? randomItem(REPOS) : undefined,
    file: Math.random() > 0.4 ? randomItem(FILES) : undefined,
    line_start: Math.random() > 0.5 ? Math.floor(Math.random() * 500) + 1 : undefined,
    tags: Math.random() > 0.3 ? randomItems(TAGS, Math.floor(Math.random() * 3) + 1) : undefined,
    created_at: created
  };
}

export function generateDummyEntries(count: number = 50): DummyEntry[] {
  const entries: DummyEntry[] = [];
  
  // Generate entries spread across last 30 days
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor((i / count) * 30);
    entries.push(generateEntry(i + 1, daysAgo));
  }
  
  // Sort by created_at descending
  return entries.sort((a, b) => b.created_at - a.created_at);
}

export function generateDummyIdeas(count: number = 20): DummyEntry[] {
  const ideas: DummyEntry[] = [];
  for (let i = 0; i < count; i++) {
    ideas.push(generateEntry(i + 100, Math.floor(Math.random() * 14), "idea"));
  }
  return ideas.sort((a, b) => b.created_at - a.created_at);
}

export function generateDummyTasks() {
  const now = Date.now();
  return [
    {
      id: 1,
      title: "Review pull request #234",
      description: "Code review for authentication refactor",
      priority: "high",
      status: "pending",
      due_date: now + 2 * 60 * 60 * 1000, // 2 hours from now
      created_at: now - 24 * 60 * 60 * 1000,
      tags: ["code-review", "urgent"]
    },
    {
      id: 2,
      title: "Update API documentation",
      description: "Add examples for new endpoints",
      priority: "medium",
      status: "in-progress",
      due_date: now + 24 * 60 * 60 * 1000, // tomorrow
      created_at: now - 48 * 60 * 60 * 1000,
      tags: ["documentation"]
    },
    {
      id: 3,
      title: "Fix production bug in payment flow",
      description: "Users reporting timeout errors",
      priority: "critical",
      status: "pending",
      due_date: now + 1 * 60 * 60 * 1000, // 1 hour from now
      created_at: now - 2 * 60 * 60 * 1000,
      tags: ["bug", "production", "urgent"]
    },
    {
      id: 4,
      title: "Refactor database queries",
      description: "Optimize N+1 queries in user dashboard",
      priority: "medium",
      status: "pending",
      due_date: now + 3 * 24 * 60 * 60 * 1000, // 3 days
      created_at: now - 72 * 60 * 60 * 1000,
      tags: ["performance", "refactor"]
    },
    {
      id: 5,
      title: "Prepare sprint demo",
      description: "Showcase new features to stakeholders",
      priority: "high",
      status: "pending",
      due_date: now + 4 * 60 * 60 * 1000, // 4 hours
      created_at: now - 24 * 60 * 60 * 1000,
      tags: ["demo", "presentation"]
    },
    {
      id: 6,
      title: "Write unit tests for auth module",
      description: "Increase coverage to 80%",
      priority: "medium",
      status: "in-progress",
      due_date: now + 2 * 24 * 60 * 60 * 1000,
      created_at: now - 96 * 60 * 60 * 1000,
      tags: ["testing", "quality"]
    },
    {
      id: 7,
      title: "Update dependencies",
      description: "Security patches for npm packages",
      priority: "high",
      status: "pending",
      due_date: now + 6 * 60 * 60 * 1000,
      created_at: now - 12 * 60 * 60 * 1000,
      tags: ["security", "maintenance"]
    },
    {
      id: 8,
      title: "Design system migration",
      description: "Move components to new design tokens",
      priority: "low",
      status: "pending",
      due_date: now + 7 * 24 * 60 * 60 * 1000,
      created_at: now - 120 * 60 * 60 * 1000,
      tags: ["ui", "design-system"]
    }
  ];
}

export function generateDummyCalendarEvents() {
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return [
    {
      id: 1,
      title: "Daily Standup",
      description: "Team sync - 15 minutes",
      start_time: today.getTime() + 10 * 60 * 60 * 1000, // 10 AM today
      end_time: today.getTime() + 10.25 * 60 * 60 * 1000,
      type: "meeting",
      attendees: ["team@company.com"],
      location: "Zoom",
      recurring: "daily"
    },
    {
      id: 2,
      title: "Sprint Planning",
      description: "Plan next 2-week sprint",
      start_time: today.getTime() + 14 * 60 * 60 * 1000, // 2 PM today
      end_time: today.getTime() + 16 * 60 * 60 * 1000,
      type: "meeting",
      attendees: ["dev-team@company.com", "product@company.com"],
      location: "Conference Room A",
      recurring: "biweekly"
    },
    {
      id: 3,
      title: "Code Review Session",
      description: "Review PRs with senior dev",
      start_time: today.getTime() + 15 * 60 * 60 * 1000, // 3 PM today
      end_time: today.getTime() + 16 * 60 * 60 * 1000,
      type: "focus-time",
      attendees: ["senior-dev@company.com"],
      location: "Virtual",
      recurring: "none"
    },
    {
      id: 4,
      title: "Client Demo",
      description: "Showcase new dashboard features",
      start_time: today.getTime() + 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000, // 11 AM tomorrow
      end_time: today.getTime() + 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000,
      type: "meeting",
      attendees: ["client@external.com", "sales@company.com"],
      location: "Google Meet",
      recurring: "none"
    },
    {
      id: 5,
      title: "Architecture Review",
      description: "Discuss microservices migration",
      start_time: today.getTime() + 48 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000, // 10 AM in 2 days
      end_time: today.getTime() + 48 * 60 * 60 * 1000 + 11.5 * 60 * 60 * 1000,
      type: "meeting",
      attendees: ["architects@company.com", "tech-leads@company.com"],
      location: "Conference Room B",
      recurring: "weekly"
    },
    {
      id: 6,
      title: "Deep Work Block",
      description: "Focus time for feature development",
      start_time: today.getTime() + 9 * 60 * 60 * 1000, // 9 AM today
      end_time: today.getTime() + 12 * 60 * 60 * 1000,
      type: "focus-time",
      attendees: [],
      location: "Do Not Disturb",
      recurring: "daily"
    },
    {
      id: 7,
      title: "1-on-1 with Manager",
      description: "Weekly sync and career discussion",
      start_time: today.getTime() + 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000, // 4 PM tomorrow
      end_time: today.getTime() + 24 * 60 * 60 * 1000 + 16.5 * 60 * 60 * 1000,
      type: "meeting",
      attendees: ["manager@company.com"],
      location: "Private Office",
      recurring: "weekly"
    }
  ];
}

export function generateDummyNotifications() {
  const now = Date.now();
  return [
    {
      id: 1,
      title: "Pull Request Approved",
      message: "Your PR #234 'Add authentication middleware' has been approved by 2 reviewers",
      type: "success",
      priority: "normal",
      read: false,
      created_at: now - 5 * 60 * 1000, // 5 minutes ago
      action_url: "/github/pr/234"
    },
    {
      id: 2,
      title: "Build Failed",
      message: "CI/CD pipeline failed for branch 'feature/new-dashboard'. Check logs for details.",
      type: "error",
      priority: "high",
      read: false,
      created_at: now - 15 * 60 * 1000, // 15 minutes ago
      action_url: "/ci/builds/latest"
    },
    {
      id: 3,
      title: "Meeting Starting Soon",
      message: "Daily Standup starts in 10 minutes",
      type: "info",
      priority: "normal",
      read: false,
      created_at: now - 2 * 60 * 1000,
      action_url: "/calendar"
    },
    {
      id: 4,
      title: "Code Review Requested",
      message: "Sarah Chen requested your review on PR #245",
      type: "info",
      priority: "normal",
      read: true,
      created_at: now - 60 * 60 * 1000, // 1 hour ago
      action_url: "/github/pr/245"
    },
    {
      id: 5,
      title: "Security Alert",
      message: "3 high-severity vulnerabilities found in dependencies. Update recommended.",
      type: "warning",
      priority: "high",
      read: false,
      created_at: now - 30 * 60 * 1000,
      action_url: "/security/alerts"
    },
    {
      id: 6,
      title: "Deployment Successful",
      message: "Version 2.4.1 deployed to production successfully",
      type: "success",
      priority: "normal",
      read: true,
      created_at: now - 2 * 60 * 60 * 1000,
      action_url: "/deployments"
    },
    {
      id: 7,
      title: "New Comment on Issue",
      message: "Alex replied to your comment on issue #156",
      type: "info",
      priority: "low",
      read: true,
      created_at: now - 3 * 60 * 60 * 1000,
      action_url: "/issues/156"
    },
    {
      id: 8,
      title: "Performance Alert",
      message: "API response time increased by 40% in the last hour",
      type: "warning",
      priority: "high",
      read: false,
      created_at: now - 10 * 60 * 1000,
      action_url: "/monitoring/performance"
    }
  ];
}

export function generateDummyRoutines() {
  return [
    {
      id: 1,
      name: "Morning Routine",
      description: "Start the day right",
      time: "09:00",
      enabled: true,
      tasks: [
        "Check overnight alerts and logs",
        "Review pull requests",
        "Plan daily priorities",
        "Update task board"
      ],
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    },
    {
      id: 2,
      name: "Pre-Standup Check",
      description: "Prepare for daily standup",
      time: "09:45",
      enabled: true,
      tasks: [
        "Review yesterday's commits",
        "Check blockers",
        "Prepare status update"
      ],
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    },
    {
      id: 3,
      name: "Afternoon Focus Block",
      description: "Deep work session",
      time: "14:00",
      enabled: true,
      tasks: [
        "Turn on Do Not Disturb",
        "Close Slack",
        "Focus on feature development",
        "Take notes on progress"
      ],
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    },
    {
      id: 4,
      name: "End of Day Wrap-up",
      description: "Close out the workday",
      time: "17:30",
      enabled: true,
      tasks: [
        "Commit and push code",
        "Update task status",
        "Write daily summary",
        "Plan tomorrow's priorities"
      ],
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    },
    {
      id: 5,
      name: "Weekly Review",
      description: "Reflect on the week",
      time: "16:00",
      enabled: true,
      tasks: [
        "Review completed tasks",
        "Update documentation",
        "Clean up branches",
        "Plan next week"
      ],
      days: ["friday"]
    }
  ];
}

export function generateDummyAutomations() {
  return [
    {
      id: 1,
      name: "Slack Standup Notification",
      trigger_kind: "note",
      action: "Post to #standup channel",
      enabled: 1,
      created_at: Date.now() - 7 * 24 * 60 * 60 * 1000
    },
    {
      id: 2,
      name: "Bug Alert to Team",
      trigger_kind: "debug",
      action: "Send email to dev-team@company.com",
      enabled: 1,
      created_at: Date.now() - 14 * 24 * 60 * 60 * 1000
    },
    {
      id: 3,
      name: "Decision Log to Confluence",
      trigger_kind: "decision",
      action: "Create page in Architecture Decisions space",
      enabled: 0,
      created_at: Date.now() - 21 * 24 * 60 * 60 * 1000
    }
  ];
}

export function generateDummyGitHubActivity(days: number) {
  const contributions = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const count = Math.floor(Math.random() * 15);
    contributions.push({
      date: date.toISOString().split('T')[0],
      count
    });
  }
  
  // Calculate streak
  let streak = 0;
  for (let i = contributions.length - 1; i >= 0; i--) {
    if (contributions[i].count > 0) {
      streak++;
    } else {
      break;
    }
  }
  
  return {
    user: "demo",
    days,
    contributions,
    streak
  };
}

export function generateDummyProfile() {
  return {
    name: "Alex Chen",
    handle: "alexchen",
    bio: "Senior Software Architect | Building the future of AI-powered development tools",
    pronouns: "they/them",
    timezone: "America/Los_Angeles",
    public_url: "https://alexchen.dev"
  };
}

export function generateDummyWellness() {
  const minutesSinceBreak = Math.floor(Math.random() * 120);
  return {
    minutes_since_break: minutesSinceBreak,
    break_due: minutesSinceBreak > 90,
    last_break_at: Date.now() - (minutesSinceBreak * 60 * 1000),
    breaks_today: Math.floor(Math.random() * 5) + 1
  };
}

// Made with Bob
