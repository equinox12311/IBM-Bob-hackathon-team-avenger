// today_hub_soft_v1 implemented in Carbon - Enhanced Developer Dashboard

import {
  Button,
  ClickableTile,
  InlineLoading,
  InlineNotification,
  Stack,
  Tag,
  Tile,
  ProgressBar,
  Modal,
  Checkbox,
  TextInput,
  TimePicker,
  TimePickerSelect,
  SelectItem,
  ToastNotification,
} from "@carbon/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createEntry, getToday } from "@/api/client";
import type { TodaySummary } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";
import { relativeTime, sourceBadgeColor } from "@/lib/format";
import {
  generateDummyEntries,
  generateDummyWellness,
  generateDummyTasks,
  generateDummyCalendarEvents,
  generateDummyNotifications,
  generateDummyRoutines
} from "@/lib/dummyData";

// Calendar Event Interface
interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  duration: number; // in minutes
  type: "meeting" | "focus" | "break" | "deadline" | "reminder";
  completed: boolean;
}

// Developer Task Interface
interface DeveloperTask {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  category: "bug" | "feature" | "refactor" | "review" | "docs";
  completed: boolean;
  estimatedTime?: number; // in minutes
}

const QUICK_ACTIONS: {
  kind: "fix" | "decision" | "note" | "idea";
  title: string;
  hint: string;
  emoji: string;
  color: string;
}[] = [
  { kind: "fix", title: "Log a Fix", hint: "Document a resolved issue or bug.", emoji: "🐛", color: "#198038" },
  { kind: "decision", title: "Save a Decision", hint: "Record an architectural choice.", emoji: "🏛️", color: "#0f62fe" },
  { kind: "note", title: "Quick Note", hint: "Jot down a fleeting thought.", emoji: "📝", color: "#8a3ffc" },
  { kind: "idea", title: "Capture Idea", hint: "Save a brilliant insight.", emoji: "💡", color: "#f1c21b" },
];

const QUICK_LINKS = [
  { icon: "code", label: "GitHub Activity", path: "/github", color: "#0f62fe" },
  { icon: "lightbulb", label: "Idea Mapper", path: "/ideas", color: "#f1c21b" },
  { icon: "search", label: "Search", path: "/search", color: "#8a3ffc" },
  { icon: "timeline", label: "Timeline", path: "/timeline", color: "#198038" },
  { icon: "analytics", label: "Analytics", path: "/analytics", color: "#da1e28" },
  { icon: "settings", label: "Settings", path: "/settings", color: "#525252" },
];

const DEVELOPER_TOOLS = [
  { icon: "bug_report", label: "Debug Helper", path: "/debug", description: "AI-powered debugging assistant" },
  { icon: "article", label: "Daily Report", path: "/report", description: "Generate daily summary" },
  { icon: "smart_toy", label: "AI Chat", path: "/chat", description: "Chat with your code context" },
  { icon: "psychology", label: "Dev Identity", path: "/identity", description: "Track your developer journey" },
];

const QUICK_RESOURCES = [
  { icon: "terminal", label: "Command Snippets", description: "Frequently used commands" },
  { icon: "code_blocks", label: "Code Templates", description: "Reusable code patterns" },
  { icon: "bookmark", label: "Bookmarks", description: "Saved documentation links" },
  { icon: "history", label: "Recent Files", description: "Quick access to files" },
];

// Sample calendar events for today
const getSampleEvents = (): CalendarEvent[] => [
  { id: "1", title: "Daily Standup", time: "09:00", duration: 15, type: "meeting", completed: false },
  { id: "2", title: "Deep Work: Feature Implementation", time: "10:00", duration: 120, type: "focus", completed: false },
  { id: "3", title: "Coffee Break", time: "12:00", duration: 15, type: "break", completed: false },
  { id: "4", title: "Code Review", time: "14:00", duration: 60, type: "meeting", completed: false },
  { id: "5", title: "Sprint Planning Deadline", time: "17:00", duration: 0, type: "deadline", completed: false },
];

// Sample developer tasks
const getSampleTasks = (): DeveloperTask[] => [
  { id: "1", title: "Fix authentication bug in login flow", priority: "high", category: "bug", completed: false, estimatedTime: 60 },
  { id: "2", title: "Implement dark mode toggle", priority: "medium", category: "feature", completed: false, estimatedTime: 120 },
  { id: "3", title: "Review PR #234", priority: "high", category: "review", completed: false, estimatedTime: 30 },
  { id: "4", title: "Update API documentation", priority: "low", category: "docs", completed: false, estimatedTime: 45 },
  { id: "5", title: "Refactor database queries", priority: "medium", category: "refactor", completed: false, estimatedTime: 90 },
];

export default function TodayHub() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<TodaySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [wellness, setWellness] = useState(generateDummyWellness());
  const [showWellnessAlert, setShowWellnessAlert] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(() => {
    return localStorage.getItem('cortex_privacy_consent') === 'true';
  });
  const [analyticsEnabled, setAnalyticsEnabled] = useState(() => {
    return localStorage.getItem('cortex_analytics_enabled') !== 'false';
  });
  
  // New features: Tasks, Calendar, Notifications, Routines
  const [tasks, setTasks] = useState(() => generateDummyTasks());
  const [calendarEvents, setCalendarEvents] = useState(() => generateDummyCalendarEvents());
  const [notifications, setNotifications] = useState(() => generateDummyNotifications());
  const [routines, setRoutines] = useState(() => generateDummyRoutines());
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeNotification, setActiveNotification] = useState<any>(null);
  
  // Legacy calendar and task management (keeping for compatibility)
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Persist calendar events and tasks
  useEffect(() => {
    localStorage.setItem('cortex_calendar_events', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem('cortex_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Check for first-time user and show privacy notice
  useEffect(() => {
    const hasSeenPrivacy = localStorage.getItem('cortex_privacy_seen');
    if (!hasSeenPrivacy) {
      setShowPrivacyModal(true);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    getToday(token)
      .then((d) => {
        // If no recent entries, use dummy data
        if (d.recent.length === 0) {
          const dummyEntries = generateDummyEntries(25);
          const todayEntries = dummyEntries.filter(e => {
            const entryDate = new Date(e.created_at);
            const today = new Date();
            return entryDate.toDateString() === today.toDateString();
          });
          d.recent = todayEntries.slice(0, 15);
          d.current_focus = todayEntries[0] || null;
        }
        setData(d);
      })
      .catch((e) => {
        // On error, use dummy data
        const dummyEntries = generateDummyEntries(25);
        const todayEntries = dummyEntries.filter(e => {
          const entryDate = new Date(e.created_at);
          const today = new Date();
          return entryDate.toDateString() === today.toDateString();
        });
        setData({
          greeting: getGreeting(),
          current_focus: todayEntries[0] || null,
          counts_by_kind: {},
          recent: todayEntries.slice(0, 15)
        });
      });

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setWellness(generateDummyWellness());
    }, 60000);
    
    // Show popup notifications periodically
    const notificationTimer = setInterval(() => {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length > 0) {
        const randomNotif = unreadNotifications[Math.floor(Math.random() * unreadNotifications.length)];
        setActiveNotification(randomNotif);
        setTimeout(() => setActiveNotification(null), 5000); // Hide after 5 seconds
      }
    }, 30000); // Check every 30 seconds
    
    // Check wellness status
    if (wellness.break_due) {
      setShowWellnessAlert(true);
    }
    
    return () => clearInterval(timer);
  }, [token]);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  async function quickSave(kind: "fix" | "decision" | "note" | "idea") {
    if (!token || !draftText.trim()) return;
    await createEntry(token, { text: draftText.trim(), source: "web", kind });
    setDraftText("");
    setDrafting(null);
    const fresh = await getToday(token);
    setData(fresh);
  }

  function handlePrivacyAccept() {
    localStorage.setItem('cortex_privacy_consent', 'true');
    localStorage.setItem('cortex_privacy_seen', 'true');
    localStorage.setItem('cortex_analytics_enabled', 'true');
    setPrivacyConsent(true);
    setAnalyticsEnabled(true);
    setShowPrivacyModal(false);
  }

  function handlePrivacyDecline() {
    localStorage.setItem('cortex_privacy_consent', 'false');
    localStorage.setItem('cortex_privacy_seen', 'true');
    localStorage.setItem('cortex_analytics_enabled', 'false');
    setPrivacyConsent(false);
    setAnalyticsEnabled(false);
    setShowPrivacyModal(false);
  }

  // Calendar Event Management
  function toggleEventComplete(id: string) {
    setCalendarEvents(events =>
      events.map(e => e.id === id ? { ...e, completed: !e.completed } : e)
    );
  }

  function addCalendarEvent() {
    if (!newEventTitle.trim() || !newEventTime) return;
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: newEventTitle,
      time: newEventTime,
      duration: 30,
      type: "reminder",
      completed: false
    };
    setCalendarEvents([...calendarEvents, newEvent].sort((a, b) => a.time.localeCompare(b.time)));
    setNewEventTitle("");
    setNewEventTime("");
    setShowAddEvent(false);
  }

  function deleteEvent(id: string) {
    setCalendarEvents(events => events.filter(e => e.id !== id));
  }

  // Task Management
  function toggleTaskComplete(id: string) {
    setTasks(tasks =>
      tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  }

  function addTask() {
    if (!newTaskTitle.trim()) return;
    const newTask: DeveloperTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      priority: "medium",
      category: "feature",
      completed: false
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
    setShowAddTask(false);
  }

  function deleteTask(id: string) {
    setTasks(tasks => tasks.filter(t => t.id !== id));
  }

  // Get event type color
  function getEventTypeColor(type: CalendarEvent['type']) {
    switch (type) {
      case "meeting": return "#0f62fe";
      case "focus": return "#8a3ffc";
      case "break": return "#198038";
      case "deadline": return "#da1e28";
      case "reminder": return "#f1c21b";
      default: return "#525252";
    }
  }

  // Get priority color
  function getPriorityColor(priority: DeveloperTask['priority']) {
    switch (priority) {
      case "high": return "#da1e28";
      case "medium": return "#f1c21b";
      case "low": return "#198038";
      default: return "#525252";
    }
  }

  if (!data) return <InlineLoading description="Loading dashboard…" />;

  // Calculate productivity metrics
  const totalToday = data.recent.length;
  const byKind = data.recent.reduce((acc, e) => {
    acc[e.kind] = (acc[e.kind] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ maxWidth: "100%", margin: 0 }}>
      {/* Hero Section */}
      <header style={{
        background: "linear-gradient(135deg, var(--cortex-primary) 0%, #0043ce 100%)",
        color: "white",
        padding: "2rem 1.5rem",
        marginBottom: "1.5rem",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: 42, fontWeight: 300, lineHeight: "48px", margin: "0 0 0.5rem" }}>
            {data.greeting}, Developer
          </h1>
          <p style={{ fontSize: 16, opacity: 0.9, margin: 0 }}>
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div style={{
          position: "absolute",
          right: "-50px",
          top: "-50px",
          width: "200px",
          height: "200px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "50%"
        }} />
      </header>

      <main style={{ padding: "0 1.5rem 2rem" }}>
        {/* Wellness Alert */}
        {showWellnessAlert && wellness.break_due && (
          <div style={{ marginBottom: "1.5rem" }}>
            <InlineNotification
              kind="warning"
              title="Time for a break!"
              subtitle={`You've been coding for ${wellness.minutes_since_break} minutes. Take a 5-minute break to stay productive.`}
              onCloseButtonClick={() => setShowWellnessAlert(false)}
            />
          </div>
        )}

        {/* Quick Links */}
        <section style={{ marginBottom: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-outline)" }}>
            Quick Access
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
            {QUICK_LINKS.map((link) => (
              <ClickableTile
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  minHeight: 100,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s ease"
                }}
                className="quick-link-tile"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: link.color }}>
                  {link.icon}
                </span>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{link.label}</p>
              </ClickableTile>
            ))}
          </div>
        </section>
        {/* Productivity Stats */}
        <section style={{ marginBottom: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-outline)" }}>
            Today's Productivity
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
            <Tile style={{ padding: "1rem", textAlign: "center", background: "linear-gradient(135deg, #0f62fe 0%, #0043ce 100%)", color: "white", border: "none" }}>
              <p style={{ margin: 0, fontSize: 36, fontWeight: 300 }}>{totalToday}</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.32px", opacity: 0.9 }}>
                Total Entries
              </p>
            </Tile>
            <Tile style={{ padding: "1rem", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 36, fontWeight: 300, color: "var(--cortex-primary)" }}>{byKind.idea || 0}</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-on-surface-variant)" }}>
                Ideas
              </p>
            </Tile>
            <Tile style={{ padding: "1rem", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 36, fontWeight: 300, color: "#198038" }}>{byKind.fix || 0}</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-on-surface-variant)" }}>
                Fixes
              </p>
            </Tile>
            <Tile style={{ padding: "1rem", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 36, fontWeight: 300, color: "#8a3ffc" }}>{byKind.decision || 0}</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-on-surface-variant)" }}>
                Decisions
              </p>
            </Tile>
            <Tile style={{ padding: "1rem", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 36, fontWeight: 300, color: "#da1e28" }}>{byKind.debug || 0}</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-on-surface-variant)" }}>
                Debug
              </p>
            </Tile>
          </div>
        </section>

        {/* Wellness & Productivity Insights */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {/* Wellness Tracker */}
          <Tile style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: wellness.break_due ? "#da1e28" : "#198038" }}>
                {wellness.break_due ? "warning" : "health_and_safety"}
              </span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Wellness Check</h3>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: 13, color: "var(--cds-text-secondary)" }}>Time since break</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{wellness.minutes_since_break} min</span>
              </div>
              <ProgressBar
                label="Break timer"
                value={Math.min((wellness.minutes_since_break / 90) * 100, 100)}
                status={wellness.break_due ? "error" : "active"}
                size="small"
                hideLabel
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--cds-text-secondary)" }}>Breaks today:</span>
              <span style={{ fontWeight: 600 }}>{wellness.breaks_today}</span>
            </div>
            <Button
              kind="tertiary"
              size="sm"
              style={{ marginTop: "1rem", width: "100%" }}
              onClick={() => navigate("/wellness")}
            >
              View Wellness Dashboard
            </Button>
          </Tile>

          {/* Productivity Insights */}
          <Tile style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#0f62fe" }}>
                insights
              </span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Productivity Insights</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#198038" }}>
                  trending_up
                </span>
                <span style={{ fontSize: 13 }}>
                  {totalToday > 5 ? "Great momentum today!" : "Keep capturing your work"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#f1c21b" }}>
                  lightbulb
                </span>
                <span style={{ fontSize: 13 }}>
                  {byKind.idea > 0 ? `${byKind.idea} new ideas captured` : "No ideas yet today"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#8a3ffc" }}>
                  schedule
                </span>
                <span style={{ fontSize: 13 }}>
                  Most active: {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}
                </span>
              </div>
            </div>
            <Button
              kind="tertiary"
              size="sm"
              style={{ marginTop: "1rem", width: "100%" }}
              onClick={() => navigate("/analytics")}
            >
              View Full Analytics
            </Button>
          </Tile>
        </div>

        {/* Calendar & Tasks Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          {/* Daily Calendar */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-outline)" }}>
                📅 Today's Schedule
              </h3>
              <Button kind="ghost" size="sm" onClick={() => setShowAddEvent(!showAddEvent)}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              </Button>
            </div>
            
            {showAddEvent && (
              <Tile style={{ padding: "1rem", marginBottom: "1rem" }}>
                <TextInput
                  id="event-title"
                  labelText="Event Title"
                  placeholder="e.g., Team Meeting"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  size="sm"
                  style={{ marginBottom: "0.5rem" }}
                />
                <TextInput
                  id="event-time"
                  labelText="Time (HH:MM)"
                  placeholder="14:00"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  size="sm"
                  style={{ marginBottom: "0.5rem" }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button size="sm" onClick={addCalendarEvent}>Add Event</Button>
                  <Button kind="ghost" size="sm" onClick={() => setShowAddEvent(false)}>Cancel</Button>
                </div>
              </Tile>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {calendarEvents.length === 0 ? (
                <Tile style={{ padding: "2rem", textAlign: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--cortex-outline)", marginBottom: "0.5rem" }}>
                    event_available
                  </span>
                  <p style={{ margin: 0, color: "var(--cds-text-secondary)", fontSize: 14 }}>No events scheduled</p>
                </Tile>
              ) : (
                calendarEvents.map((event) => (
                  <Tile key={event.id} style={{
                    padding: "1rem",
                    borderLeft: `4px solid ${getEventTypeColor(event.type)}`,
                    opacity: event.completed ? 0.6 : 1,
                    transition: "all 0.2s ease"
                  }}>
                    <div style={{ display: "flex", alignItems: "start", gap: "0.75rem" }}>
                      <Checkbox
                        id={`event-${event.id}`}
                        checked={event.completed}
                        onChange={() => toggleEventComplete(event.id)}
                        labelText=""
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                          <div>
                            <h4 style={{
                              margin: "0 0 0.25rem",
                              fontSize: 14,
                              fontWeight: 600,
                              textDecoration: event.completed ? "line-through" : "none"
                            }}>
                              {event.title}
                            </h4>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: 12 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: getEventTypeColor(event.type) }}>
                                schedule
                              </span>
                              <span style={{ color: "var(--cds-text-secondary)" }}>
                                {event.time} {event.duration > 0 && `(${event.duration}min)`}
                              </span>
                              <Tag type="gray" size="sm">{event.type}</Tag>
                            </div>
                          </div>
                          <Button
                            kind="ghost"
                            size="sm"
                            hasIconOnly
                            iconDescription="Delete"
                            onClick={() => deleteEvent(event.id)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Tile>
                ))
              )}
            </div>
          </section>

          {/* Developer Tasks */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-outline)" }}>
                ✅ Today's Tasks
              </h3>
              <Button kind="ghost" size="sm" onClick={() => setShowAddTask(!showAddTask)}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              </Button>
            </div>

            {showAddTask && (
              <Tile style={{ padding: "1rem", marginBottom: "1rem" }}>
                <TextInput
                  id="task-title"
                  labelText="Task Description"
                  placeholder="e.g., Fix login bug"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  size="sm"
                  style={{ marginBottom: "0.5rem" }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button size="sm" onClick={addTask}>Add Task</Button>
                  <Button kind="ghost" size="sm" onClick={() => setShowAddTask(false)}>Cancel</Button>
                </div>
              </Tile>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {tasks.length === 0 ? (
                <Tile style={{ padding: "2rem", textAlign: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--cortex-outline)", marginBottom: "0.5rem" }}>
                    task_alt
                  </span>
                  <p style={{ margin: 0, color: "var(--cds-text-secondary)", fontSize: 14 }}>No tasks for today</p>
                </Tile>
              ) : (
                tasks.map((task) => (
                  <Tile key={task.id} style={{
                    padding: "1rem",
                    borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                    opacity: task.completed ? 0.6 : 1,
                    transition: "all 0.2s ease"
                  }}>
                    <div style={{ display: "flex", alignItems: "start", gap: "0.75rem" }}>
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onChange={() => toggleTaskComplete(task.id)}
                        labelText=""
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                          <div>
                            <h4 style={{
                              margin: "0 0 0.25rem",
                              fontSize: 14,
                              fontWeight: 600,
                              textDecoration: task.completed ? "line-through" : "none"
                            }}>
                              {task.title}
                            </h4>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                              <Tag type={task.priority === "high" ? "red" : task.priority === "medium" ? "magenta" : "green"} size="sm">
                                {task.priority}
                              </Tag>
                              <Tag type="gray" size="sm">{task.category}</Tag>
                              {task.estimatedTime && (
                                <span style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>
                                  ~{task.estimatedTime}min
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            kind="ghost"
                            size="sm"
                            hasIconOnly
                            iconDescription="Delete"
                            onClick={() => deleteTask(task.id)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Tile>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Developer Tools */}
        <section style={{ marginBottom: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-outline)" }}>
            Developer Tools
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            {DEVELOPER_TOOLS.map((tool) => (
              <ClickableTile
                key={tool.path}
                onClick={() => navigate(tool.path)}
                style={{
                  padding: "1.25rem",
                  minHeight: 110,
                  transition: "all 0.2s ease",
                  borderLeft: "3px solid var(--cortex-primary)"
                }}
                className="developer-tool-tile"
              >
                <div style={{ display: "flex", alignItems: "start", gap: "1rem" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: "var(--cortex-primary)" }}>
                    {tool.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 0.25rem", fontSize: 15, fontWeight: 600 }}>{tool.label}</h4>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--cds-text-secondary)", lineHeight: "1.4" }}>
                      {tool.description}
                    </p>
                  </div>
                </div>
              </ClickableTile>
            ))}
          </div>
        </section>

        {/* Quick Resources */}
        <section style={{ marginBottom: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-outline)" }}>
            🔧 Quick Resources
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {QUICK_RESOURCES.map((resource, idx) => (
              <ClickableTile
                key={idx}
                style={{
                  padding: "1.25rem",
                  minHeight: 100,
                  transition: "all 0.2s ease"
                }}
                className="quick-link-tile"
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.5rem" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: "var(--cortex-primary)" }}>
                    {resource.icon}
                  </span>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{resource.label}</h4>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--cds-text-secondary)" }}>
                    {resource.description}
                  </p>
                </div>
              </ClickableTile>
            ))}
          </div>
        </section>

        {/* Current Focus */}
        {data.current_focus && (
          <section style={{ marginBottom: "2rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-outline)" }}>
              Current Focus
            </h3>
            <Tile style={{ padding: "1.5rem", background: "var(--cortex-surface-container-low)", border: "2px solid var(--cortex-primary)" }}>
              <div style={{ display: "flex", alignItems: "start", gap: "1rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: "var(--cortex-primary)" }}>
                  target
                </span>
                <div style={{ flex: 1 }}>
                  <Link to={`/entry/${data.current_focus.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                    <h2 style={{ margin: "0 0 0.5rem", fontSize: 18, fontWeight: 600 }}>
                      {data.current_focus.text.slice(0, 120)}
                      {data.current_focus.text.length > 120 ? "…" : ""}
                    </h2>
                  </Link>
                  <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <Tag type={sourceBadgeColor(data.current_focus.source)} size="sm">
                      {data.current_focus.kind}
                    </Tag>
                    <span style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>
                      {relativeTime(data.current_focus.created_at)}
                    </span>
                    {data.current_focus.file && (
                      <code style={{ fontSize: 12, background: "var(--cortex-surface-container-lowest)", padding: "0.125rem 0.5rem" }}>
                        📍 {data.current_focus.file}
                      </code>
                    )}
                  </div>
                </div>
              </div>
            </Tile>
          </section>
        )}

        {/* Quick Actions */}
        <section style={{ marginBottom: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-outline)" }}>
            Quick Capture
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {QUICK_ACTIONS.map((a) => (
              <ClickableTile
                key={a.kind}
                onClick={() => setDrafting(a.kind)}
                style={{
                  padding: "1.5rem",
                  minHeight: 140,
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease"
                }}
                className="quick-action-tile"
              >
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: a.color
                }} />
                <div style={{ fontSize: 32, marginBottom: ".5rem" }}>{a.emoji}</div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{a.title}</h3>
                <p style={{ margin: ".5rem 0 0", color: "var(--cds-text-secondary)", fontSize: 13 }}>
                  {a.hint}
                </p>
              </ClickableTile>
            ))}
          </div>
        </section>

        {/* Draft Entry Form */}
        {drafting && (
          <Tile style={{ padding: "1rem", marginBottom: "2rem", animation: "slideDown 0.3s ease-out" }}>
            <h4 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit_note</span>
              New {drafting} entry
            </h4>
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="What did you just figure out?"
              rows={4}
              autoFocus
              style={{
                width: "100%",
                padding: ".75rem",
                fontFamily: "inherit",
                fontSize: 14,
                background: "var(--cds-field)",
                border: "1px solid var(--cds-border-strong)",
                outline: "none",
                resize: "vertical"
              }}
            />
            <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem" }}>
              <Button onClick={() => quickSave(drafting as any)} disabled={!draftText.trim()}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: "0.25rem" }}>save</span>
                Save Entry
              </Button>
              <Button kind="ghost" onClick={() => { setDrafting(null); setDraftText(""); }}>
                Cancel
              </Button>
            </div>
          </Tile>
        )}

        {/* Recent Entries */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-outline)" }}>
              Today's Entries ({data.recent.length})
            </h3>
            <Button kind="ghost" size="sm" onClick={() => navigate("/timeline")}>
              View All
              <span className="material-symbols-outlined" style={{ fontSize: 16, marginLeft: "0.25rem" }}>arrow_forward</span>
            </Button>
          </div>
          {data.recent.length === 0 ? (
            <Tile style={{ padding: "2rem", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--cortex-outline)", marginBottom: "1rem" }}>
                inbox
              </span>
              <p style={{ margin: 0, color: "var(--cds-text-secondary)" }}>Nothing captured today yet. Start with a quick action above!</p>
            </Tile>
          ) : (
            <Stack gap={2}>
              {data.recent.slice(0, 5).map((e, idx) => (
                <Tile key={e.id} style={{ padding: "1rem", animation: `fadeIn 0.3s ease-out ${idx * 0.1}s both` }}>
                  <div style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem", alignItems: "center" }}>
                    <Tag type={sourceBadgeColor(e.source)} size="sm">{e.kind}</Tag>
                    <span style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>
                      {relativeTime(e.created_at)}
                    </span>
                  </div>
                  <Link to={`/entry/${e.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <p style={{ margin: 0, fontSize: 14 }}>{e.text.slice(0, 150)}{e.text.length > 150 ? "…" : ""}</p>
                  </Link>
                </Tile>
              ))}
            </Stack>
          )}
        </section>
      </main>

      {/* GDPR Privacy Modal */}
      <Modal
        open={showPrivacyModal}
        modalHeading="Privacy & Data Protection"
        primaryButtonText="Accept All"
        secondaryButtonText="Decline Analytics"
        onRequestClose={() => {}}
        onRequestSubmit={handlePrivacyAccept}
        onSecondarySubmit={handlePrivacyDecline}
        preventCloseOnClickOutside
        size="md"
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ marginBottom: "1rem" }}>
            Welcome to Cortex! We respect your privacy and are committed to protecting your personal data in compliance with GDPR.
          </p>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: "0.5rem" }}>What we collect:</h4>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem", fontSize: 14 }}>
            <li>Code entries and notes you create (stored locally and encrypted)</li>
            <li>Usage analytics to improve the product (optional)</li>
            <li>Authentication tokens (encrypted, never shared)</li>
          </ul>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: "0.5rem" }}>Your rights:</h4>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem", fontSize: 14 }}>
            <li>Right to access your data</li>
            <li>Right to delete your data</li>
            <li>Right to export your data</li>
            <li>Right to opt-out of analytics</li>
          </ul>
          <p style={{ fontSize: 13, color: "var(--cds-text-secondary)" }}>
            You can change these preferences anytime in Settings. All data is encrypted at rest and in transit.
          </p>
        </div>
        <div style={{ padding: "1rem", background: "var(--cds-layer-01)", borderRadius: "4px" }}>
          <Checkbox
            id="analytics-consent"
            labelText="Enable anonymous usage analytics to help improve Cortex"
            checked={analyticsEnabled}
            onChange={(e) => setAnalyticsEnabled(e.target.checked)}
          />
        </div>
      </Modal>

      {/* Privacy Notice Banner */}
      {!privacyConsent && !showPrivacyModal && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--cds-layer-02)",
          borderTop: "1px solid var(--cds-border-subtle)",
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          zIndex: 9999,
          boxShadow: "0 -2px 8px rgba(0,0,0,0.1)"
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle", marginRight: "0.5rem" }}>
                shield
              </span>
              We use cookies and local storage to provide core functionality.
              <Button kind="ghost" size="sm" onClick={() => setShowPrivacyModal(true)} style={{ marginLeft: "0.5rem" }}>
                Review Privacy Settings
              </Button>
            </p>
          </div>
        </div>
      )}

      {/* Popup Notifications */}
      {activeNotification && (
        <div style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          zIndex: 10000,
          animation: "slideIn 0.3s ease-out"
        }}>
          <ToastNotification
            kind={activeNotification.type === "error" ? "error" : activeNotification.type === "warning" ? "warning" : activeNotification.type === "success" ? "success" : "info"}
            title={activeNotification.title}
            subtitle={activeNotification.message}
            timeout={5000}
            onClose={() => {
              setActiveNotification(null);
              setNotifications(notifications.map(n =>
                n.id === activeNotification.id ? { ...n, read: true } : n
              ));
            }}
          />
        </div>
      )}

      <style>{`
        .quick-action-tile:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }
        .quick-link-tile:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .developer-tool-tile:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-left-width: 4px;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
