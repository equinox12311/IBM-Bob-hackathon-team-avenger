// Small formatting helpers used across pages.

export function relativeTime(epochMs: number): string {
  const diffMs = Date.now() - epochMs;
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(epochMs).toLocaleDateString();
}

export function gitHubUrl(
  repo: string | undefined,
  file: string | undefined,
  lineStart?: number | undefined,
  lineEnd?: number | undefined,
): string | undefined {
  if (!repo || !file) return undefined;
  // Accept both "github.com/user/repo" and "https://github.com/user/repo"
  const cleaned = repo.replace(/^https?:\/\//, "").replace(/\.git$/, "");
  let url = `https://${cleaned}/blob/HEAD/${file}`;
  if (lineStart) {
    url += `#L${lineStart}`;
    if (lineEnd && lineEnd !== lineStart) url += `-L${lineEnd}`;
  }
  return url;
}

export function sourceBadgeColor(
  source: string,
): "blue" | "purple" | "green" | "magenta" | "gray" {
  switch (source) {
    case "bob":
      return "blue";
    case "telegram-text":
    case "telegram-voice":
      return "purple";
    case "web":
      return "green";
    default:
      return "gray";
  }
}
