/**
 * Comprehensive dummy data generator for Cortex Mobile
 * Provides realistic data for all features when backend is empty
 */

export interface DummyTask {
  id: number;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low' | 'critical';
  status: 'pending' | 'in-progress' | 'completed';
  due_date: number;
  created_at: number;
  tags: string[];
}

export interface DummyCalendarEvent {
  id: number;
  title: string;
  description: string;
  start_time: number;
  end_time: number;
  type: 'meeting' | 'focus-time' | 'break' | 'deadline';
  attendees: string[];
  location: string;
  recurring: 'none' | 'daily' | 'weekly' | 'biweekly';
}

export interface DummyNotification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  priority: 'high' | 'normal' | 'low';
  read: boolean;
  created_at: number;
  action_url?: string;
}

export interface DummyRoutine {
  id: number;
  name: string;
  description: string;
  time: string;
  enabled: boolean;
  tasks: string[];
  days: string[];
}

export function generateDummyTasks(): DummyTask[] {
  const now = Date.now();
  return [
    {
      id: 1,
      title: "Review pull request #234",
      description: "Code review for authentication refactor",
      priority: "high",
      status: "pending",
      due_date: now + 2 * 60 * 60 * 1000,
      created_at: now - 24 * 60 * 60 * 1000,
      tags: ["code-review", "urgent"]
    },
    {
      id: 2,
      title: "Update API documentation",
      description: "Add examples for new endpoints",
      priority: "medium",
      status: "in-progress",
      due_date: now + 24 * 60 * 60 * 1000,
      created_at: now - 48 * 60 * 60 * 1000,
      tags: ["documentation"]
    },
    {
      id: 3,
      title: "Fix production bug in payment flow",
      description: "Users reporting timeout errors",
      priority: "critical",
      status: "pending",
      due_date: now + 1 * 60 * 60 * 1000,
      created_at: now - 2 * 60 * 60 * 1000,
      tags: ["bug", "production", "urgent"]
    },
    {
      id: 4,
      title: "Refactor database queries",
      description: "Optimize N+1 queries in user dashboard",
      priority: "medium",
      status: "pending",
      due_date: now + 3 * 24 * 60 * 60 * 1000,
      created_at: now - 72 * 60 * 60 * 1000,
      tags: ["performance", "refactor"]
    },
    {
      id: 5,
      title: "Prepare sprint demo",
      description: "Showcase new features to stakeholders",
      priority: "high",
      status: "pending",
      due_date: now + 4 * 60 * 60 * 1000,
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
    }
  ];
}

export function generateDummyCalendarEvents(): DummyCalendarEvent[] {
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return [
    {
      id: 1,
      title: "Daily Standup",
      description: "Team sync - 15 minutes",
      start_time: today.getTime() + 10 * 60 * 60 * 1000,
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
      start_time: today.getTime() + 14 * 60 * 60 * 1000,
      end_time: today.getTime() + 16 * 60 * 60 * 1000,
      type: "meeting",
      attendees: ["dev-team@company.com", "product@company.com"],
      location: "Conference Room A",
      recurring: "biweekly"
    },
    {
      id: 3,
      title: "Deep Work Block",
      description: "Focus time for feature development",
      start_time: today.getTime() + 9 * 60 * 60 * 1000,
      end_time: today.getTime() + 12 * 60 * 60 * 1000,
      type: "focus-time",
      attendees: [],
      location: "Do Not Disturb",
      recurring: "daily"
    },
    {
      id: 4,
      title: "Client Demo",
      description: "Showcase new dashboard features",
      start_time: today.getTime() + 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000,
      end_time: today.getTime() + 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000,
      type: "meeting",
      attendees: ["client@external.com", "sales@company.com"],
      location: "Google Meet",
      recurring: "none"
    }
  ];
}

export function generateDummyNotifications(): DummyNotification[] {
  const now = Date.now();
  return [
    {
      id: 1,
      title: "Pull Request Approved",
      message: "Your PR #234 has been approved by 2 reviewers",
      type: "success",
      priority: "normal",
      read: false,
      created_at: now - 5 * 60 * 1000,
      action_url: "/github"
    },
    {
      id: 2,
      title: "Build Failed",
      message: "CI/CD pipeline failed. Check logs for details.",
      type: "error",
      priority: "high",
      read: false,
      created_at: now - 15 * 60 * 1000
    },
    {
      id: 3,
      title: "Meeting Starting Soon",
      message: "Daily Standup starts in 10 minutes",
      type: "info",
      priority: "normal",
      read: false,
      created_at: now - 2 * 60 * 1000
    },
    {
      id: 4,
      title: "Security Alert",
      message: "3 high-severity vulnerabilities found in dependencies",
      type: "warning",
      priority: "high",
      read: false,
      created_at: now - 30 * 60 * 1000
    },
    {
      id: 5,
      title: "Deployment Successful",
      message: "Version 2.4.1 deployed to production",
      type: "success",
      priority: "normal",
      read: true,
      created_at: now - 2 * 60 * 60 * 1000
    }
  ];
}

export function generateDummyRoutines(): DummyRoutine[] {
  return [
    {
      id: 1,
      name: "Morning Routine",
      description: "Start the day right",
      time: "09:00",
      enabled: true,
      tasks: [
        "Check overnight alerts",
        "Review pull requests",
        "Plan daily priorities"
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
      name: "End of Day Wrap-up",
      description: "Close out the workday",
      time: "17:30",
      enabled: true,
      tasks: [
        "Commit and push code",
        "Update task status",
        "Write daily summary"
      ],
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    }
  ];
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
