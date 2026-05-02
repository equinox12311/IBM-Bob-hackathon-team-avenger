/**
 * Demo Data for Adeel - AI Engineer
 * Realistic data showing 6 months of Cortex usage
 */

export const DEMO_USER = {
  name: "Adeel Mukhtar",
  handle: "adeel",
  email: "adeel@cortex.dev",
  role: "AI Engineer",
  bio: "Building intelligent systems with IBM watsonx.ai and Granite models. Passionate about RAG, LLMs, and developer productivity.",
  pronouns: "he/him",
  timezone: "Asia/Karachi",
  avatar: "https://ui-avatars.com/api/?name=Adeel+Mukhtar&background=0f62fe&color=fff&size=128",
  joined_date: "2025-11-01",
  
  // Social accounts
  accounts: {
    github: "adeel-ai",
    linkedin: "adeel-mukhtar-ai",
    twitter: "@adeel_ai_eng",
    website: "https://adeel.dev",
  },
  
  // Stats
  stats: {
    total_entries: 487,
    total_recalls: 1243,
    proactive_recalls: 342,
    agentic_captures: 156,
    time_saved_hours: 127.5,
    roi_usd: 9562.50,
    streak_days: 89,
    longest_streak: 127,
  }
};

// Recent diary entries (last 30 days)
export const DEMO_ENTRIES = [
  {
    id: 487,
    text: "Implemented Graph-RAG system for Cortex. Uses concept extraction to build knowledge graph from diary entries. Exports to markdown with Mermaid diagrams. Key insight: shared concepts create similarity edges automatically.",
    kind: "note",
    source: "bob",
    score: 1.8,
    created_at: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    tags: ["graph-rag", "knowledge-graph", "mermaid"],
    file: "src/cortex-api/cortex_api/graph_rag.py",
    line_start: 50,
    line_end: 150,
    repo: "cortex"
  },
  {
    id: 486,
    text: "Fixed type hints in Graph-RAG module. Changed 'any' to 'Any' from typing module. Python type checking is strict but catches bugs early.",
    kind: "fix",
    source: "bob",
    score: 1.2,
    created_at: Date.now() - 4 * 60 * 60 * 1000,
    tags: ["python", "type-hints", "bug-fix"],
    file: "src/cortex-api/cortex_api/graph_rag.py",
    repo: "cortex"
  },
  {
    id: 485,
    text: "Idea: Add voice-to-text for mobile capture using IBM Speech-to-Text. Would make capturing insights while commuting much easier. Could integrate with Telegram bot.",
    kind: "idea",
    source: "web",
    score: 1.5,
    created_at: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    tags: ["mobile", "voice", "ibm-stt", "telegram"]
  },
  {
    id: 484,
    text: "Debugging Granite model hallucinations in RAG responses. Issue: model sometimes invents citations. Solution: strict citation validation - only return citations with score > 0.7. Reduced hallucinations by 85%.",
    kind: "debug",
    source: "bob",
    score: 2.1,
    created_at: Date.now() - 1 * 24 * 60 * 60 * 1000,
    tags: ["granite", "rag", "llm", "hallucination"],
    file: "src/cortex-api/cortex_api/generate.py",
    line_start: 45,
    line_end: 67,
    repo: "cortex"
  },
  {
    id: 483,
    text: "Decision: Use watsonx.ai Granite embeddings as primary, with local sentence-transformers as fallback. Rationale: Granite has better semantic understanding for technical content, but local ensures offline capability.",
    kind: "decision",
    source: "bob",
    score: 1.9,
    created_at: Date.now() - 2 * 24 * 60 * 60 * 1000,
    tags: ["architecture", "embeddings", "watsonx", "granite"]
  },
  {
    id: 482,
    text: "Completed multi-agent orchestration feature. Planner → Coder → Reviewer → Tester pipeline works beautifully. Saved 6 hours on feature implementation. Bob agents are game-changing!",
    kind: "note",
    source: "bob",
    score: 2.3,
    created_at: Date.now() - 3 * 24 * 60 * 60 * 1000,
    tags: ["multi-agent", "bob", "automation", "productivity"],
    file: "src/cortex-api/cortex_api/agents.py",
    repo: "cortex"
  },
  {
    id: 481,
    text: "Learned: IBM Carbon Design System has excellent accessibility built-in. WCAG AA compliance out of the box. Just need to use semantic HTML and proper ARIA labels.",
    kind: "note",
    source: "web",
    score: 1.4,
    created_at: Date.now() - 4 * 24 * 60 * 60 * 1000,
    tags: ["carbon", "accessibility", "ui", "wcag"]
  },
  {
    id: 480,
    text: "Fixed rate limiting bug in API. Was using global counter instead of per-IP sliding window. Switched to deque-based implementation. Now properly handles burst traffic.",
    kind: "fix",
    source: "bob",
    score: 1.7,
    created_at: Date.now() - 5 * 24 * 60 * 60 * 1000,
    tags: ["security", "rate-limiting", "api", "bug-fix"],
    file: "src/cortex-api/cortex_api/server.py",
    line_start: 76,
    line_end: 100,
    repo: "cortex"
  },
  {
    id: 479,
    text: "Idea: Create 'Developer Identity Graph' showing tech stack evolution over time. Could visualize how skills grow and technologies are adopted.",
    kind: "idea",
    source: "web",
    score: 1.6,
    created_at: Date.now() - 6 * 24 * 60 * 60 * 1000,
    tags: ["visualization", "identity", "analytics"]
  },
  {
    id: 478,
    text: "Implemented secret detection with 11 patterns + entropy heuristic. Catches AWS keys, GitHub tokens, JWTs, etc. Returns HTTP 422 with redacted findings. Security is non-negotiable.",
    kind: "note",
    source: "bob",
    score: 2.0,
    created_at: Date.now() - 7 * 24 * 60 * 60 * 1000,
    tags: ["security", "secrets", "detection", "owasp"],
    file: "src/cortex-api/cortex_api/secrets.py",
    repo: "cortex"
  }
];

// Productivity metrics (6 months of data)
export const DEMO_PRODUCTIVITY_METRICS = {
  metrics: {
    time_saved_minutes: 7650, // 127.5 hours
    entries_recalled_count: 1243,
    proactive_recalls_triggered: 342,
    agentic_captures_accepted: 156,
    avg_search_time_seconds: 6.8,
    knowledge_retention_rate: 78.5,
    roi_usd: 9562.50,
    productivity_gain_percent: 15.3
  },
  comparisons: [
    {
      task: "Find past bug fix",
      without_cortex_minutes: 15,
      with_cortex_seconds: 7,
      time_saved_percent: 99.2
    },
    {
      task: "Document decision",
      without_cortex_minutes: 10,
      with_cortex_seconds: 4,
      time_saved_percent: 99.3
    },
    {
      task: "Search for code pattern",
      without_cortex_minutes: 12,
      with_cortex_seconds: 6,
      time_saved_percent: 99.2
    },
    {
      task: "Review past learnings",
      without_cortex_minutes: 20,
      with_cortex_seconds: 8,
      time_saved_percent: 99.3
    },
    {
      task: "Capture quick note",
      without_cortex_minutes: 5,
      with_cortex_seconds: 3,
      time_saved_percent: 99.0
    }
  ],
  monthly_roi: {
    monthly_time_saved_hours: 42.5,
    monthly_roi_usd: 3187.50,
    annual_roi_usd: 38250.00
  },
  period_days: 180
};

// Bob sessions (last 10 sessions)
export const DEMO_BOB_SESSIONS = [
  {
    id: 44,
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    mode: "cortex",
    task_description: "Implement Graph-RAG system with knowledge graph and markdown export",
    prompts_used: [
      "Create Graph-RAG module with concept extraction",
      "Add markdown export with frontmatter",
      "Generate Mermaid diagrams for visualization"
    ],
    tools_called: ["write_to_file", "apply_diff", "execute_command"],
    files_modified: [
      "src/cortex-api/cortex_api/graph_rag.py",
      "src/cortex-api/cortex_api/server.py"
    ],
    time_saved_minutes: 480,
    outcome: "Complete Graph-RAG system with 465 lines of code",
    coins_used: 8
  },
  {
    id: 43,
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
    mode: "code",
    task_description: "Add productivity metrics dashboard with ROI calculations",
    prompts_used: [
      "Create productivity metrics API",
      "Build professional UI with gradient cards",
      "Add before/after comparison table"
    ],
    tools_called: ["write_to_file", "apply_diff"],
    files_modified: [
      "src/cortex-api/cortex_api/productivity.py",
      "src/cortex-web/src/pages/ProductivityMetrics.tsx"
    ],
    time_saved_minutes: 360,
    outcome: "Professional metrics dashboard with quantifiable ROI",
    coins_used: 6
  },
  {
    id: 42,
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    mode: "code",
    task_description: "Implement multi-agent orchestration system",
    prompts_used: [
      "Create agent orchestrator with 5 agent types",
      "Add 4 pre-built workflow templates",
      "Implement workflow execution pipeline"
    ],
    tools_called: ["write_to_file", "apply_diff", "execute_command"],
    files_modified: [
      "src/cortex-api/cortex_api/agents.py",
      "src/cortex-api/cortex_api/server.py"
    ],
    time_saved_minutes: 420,
    outcome: "Multi-agent system with Planner, Coder, Reviewer, Tester, Documenter",
    coins_used: 7
  },
  {
    id: 41,
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
    mode: "security-review",
    task_description: "Implement comprehensive security features",
    prompts_used: [
      "Add secret detection with 11 patterns",
      "Implement rate limiting with sliding window",
      "Add OWASP security headers"
    ],
    tools_called: ["write_to_file", "apply_diff", "execute_command"],
    files_modified: [
      "src/cortex-api/cortex_api/secrets.py",
      "src/cortex-api/cortex_api/server.py",
      "tests/test_secrets.py"
    ],
    time_saved_minutes: 300,
    outcome: "Production-ready security with secret detection and rate limiting",
    coins_used: 5
  }
];

// Bob impact metrics
export const DEMO_BOB_IMPACT = {
  total_sessions: 44,
  total_time_saved_hours: 127.5,
  total_coins_used: 44,
  tools_usage: {
    "write_to_file": 87,
    "apply_diff": 156,
    "execute_command": 43,
    "read_file": 234,
    "search_files": 67,
    "list_files": 89,
    "diary_save": 342,
    "diary_recall": 1243,
    "diary_timeline": 156
  },
  modes_usage: {
    "cortex": 18,
    "code": 15,
    "architect": 6,
    "security-review": 3,
    "test-generator": 2
  },
  files_touched: 127,
  avg_time_saved_per_session: 173.9
};

// GitHub activity (6 months)
export const DEMO_GITHUB_ACTIVITY = {
  user: "adeel-ai",
  days: 180,
  contributions: generateGitHubContributions(),
  streak: 89,
  total_commits: 487,
  total_prs: 67,
  total_reviews: 134
};

function generateGitHubContributions() {
  const contributions = [];
  const now = new Date();
  
  for (let i = 179; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // More activity on weekdays, less on weekends
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseCount = isWeekend ? 1 : 3;
    
    // Random variation
    const count = Math.floor(baseCount + Math.random() * (isWeekend ? 2 : 5));
    
    contributions.push({
      date: date.toISOString().split('T')[0],
      count: count
    });
  }
  
  return contributions;
}

// Workflow templates
export const DEMO_WORKFLOW_TEMPLATES = [
  {
    id: "feature-with-tests",
    name: "Add Feature with Tests",
    description: "Plan, implement, test, and document a new feature",
    agents: ["planner", "coder", "tester", "documenter"],
    estimated_time_minutes: 15,
    example_use_case: "Add user authentication feature",
    executions: 12,
    avg_time_saved: 240
  },
  {
    id: "security-audit",
    name: "Security Audit",
    description: "Review code for security vulnerabilities and fix issues",
    agents: ["reviewer", "coder", "tester"],
    estimated_time_minutes: 10,
    example_use_case: "Audit API endpoints for SQL injection",
    executions: 8,
    avg_time_saved: 180
  },
  {
    id: "refactor-optimize",
    name: "Refactor & Optimize",
    description: "Analyze, refactor, and optimize code performance",
    agents: ["planner", "coder", "tester", "documenter"],
    estimated_time_minutes: 20,
    example_use_case: "Optimize database queries",
    executions: 15,
    avg_time_saved: 300
  },
  {
    id: "bug-fix-complete",
    name: "Complete Bug Fix",
    description: "Diagnose, fix, test, and document a bug",
    agents: ["planner", "coder", "tester", "documenter"],
    estimated_time_minutes: 12,
    example_use_case: "Fix memory leak in background worker",
    executions: 23,
    avg_time_saved: 200
  }
];

// Modernization projects
export const DEMO_MODERNIZATION_PROJECTS = [
  {
    id: "mod_1",
    type: "java_8_to_21",
    repo: "legacy-banking-api",
    status: "completed",
    files_modified: 45,
    time_taken_minutes: 120,
    manual_effort_hours: 40,
    time_saved_percent: 95,
    completed_at: Date.now() - 30 * 24 * 60 * 60 * 1000
  },
  {
    id: "mod_2",
    type: "python_2_to_3",
    repo: "data-pipeline",
    status: "completed",
    files_modified: 32,
    time_taken_minutes: 90,
    manual_effort_hours: 25,
    time_saved_percent: 94,
    completed_at: Date.now() - 60 * 24 * 60 * 60 * 1000
  },
  {
    id: "mod_3",
    type: "react_class_to_hooks",
    repo: "admin-dashboard",
    status: "in_progress",
    files_modified: 18,
    time_taken_minutes: 45,
    manual_effort_hours: 18,
    time_saved_percent: 92,
    completed_at: null
  }
];

// MCP servers generated
export const DEMO_MCP_SERVERS = [
  {
    id: "mcp_hipaa_1",
    name: "hipaa_compliance",
    description: "HIPAA Compliance Checker MCP Server",
    language: "python",
    tools_count: 2,
    generated_at: Date.now() - 45 * 24 * 60 * 60 * 1000,
    status: "deployed",
    usage_count: 67
  },
  {
    id: "mcp_api_docs_1",
    name: "api_documentation",
    description: "Automatic API Documentation Generator",
    language: "python",
    tools_count: 2,
    generated_at: Date.now() - 60 * 24 * 60 * 60 * 1000,
    status: "deployed",
    usage_count: 134
  },
  {
    id: "mcp_security_1",
    name: "security_scanner",
    description: "Security Vulnerability Scanner",
    language: "typescript",
    tools_count: 3,
    generated_at: Date.now() - 90 * 24 * 60 * 60 * 1000,
    status: "active",
    usage_count: 234
  }
];

// Legacy analyses
export const DEMO_LEGACY_ANALYSES = [
  {
    id: "legacy_1",
    repo_url: "https://github.com/company/legacy-erp",
    analyzed_at: Date.now() - 20 * 24 * 60 * 60 * 1000,
    complexity: {
      cyclomatic_complexity: 47,
      cognitive_complexity: 89,
      lines_of_code: 45000,
      comment_ratio: 0.08,
      technical_debt_hours: 320
    },
    api_endpoints_found: 67,
    migration_steps: 8,
    test_coverage: 0.23,
    documentation_coverage: 0.05
  },
  {
    id: "legacy_2",
    repo_url: "https://github.com/company/old-crm",
    analyzed_at: Date.now() - 50 * 24 * 60 * 60 * 1000,
    complexity: {
      cyclomatic_complexity: 38,
      cognitive_complexity: 72,
      lines_of_code: 32000,
      comment_ratio: 0.12,
      technical_debt_hours: 240
    },
    api_endpoints_found: 45,
    migration_steps: 6,
    test_coverage: 0.31,
    documentation_coverage: 0.08
  }
];

// Automations
export const DEMO_AUTOMATIONS = [
  {
    id: 1,
    name: "Auto-save bug fixes",
    trigger_kind: "fix",
    action: "Create GitHub issue with details",
    enabled: true,
    created_at: Date.now() - 120 * 24 * 60 * 60 * 1000,
    execution_count: 67
  },
  {
    id: 2,
    name: "Weekly summary email",
    trigger_kind: "report",
    action: "Send email with weekly highlights",
    enabled: true,
    created_at: Date.now() - 150 * 24 * 60 * 60 * 1000,
    execution_count: 24
  },
  {
    id: 3,
    name: "Idea to Trello",
    trigger_kind: "idea",
    action: "Create Trello card in Ideas board",
    enabled: true,
    created_at: Date.now() - 90 * 24 * 60 * 60 * 1000,
    execution_count: 45
  }
];

// Wellness data
export const DEMO_WELLNESS = {
  minutes_since_break: 67,
  break_due: true,
  last_break_at: Date.now() - 67 * 60 * 1000,
  breaks_today: 3,
  breaks_this_week: 18,
  avg_break_interval: 85,
  total_breaks: 234
};

// Made with Bob