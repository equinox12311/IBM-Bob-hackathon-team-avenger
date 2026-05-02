import {
  Content,
  Header,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  SkipToContent,
} from "@carbon/react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV: { to: string; label: string }[] = [
  { to: "/today", label: "Today" },
  { to: "/timeline", label: "Timeline" },
  { to: "/search", label: "Search" },
  { to: "/ideas", label: "Ideas" },
  { to: "/debug", label: "Debug" },
  { to: "/report", label: "Report" },
  { to: "/analytics", label: "Analytics" },
  { to: "/github", label: "GitHub" },
  { to: "/automations", label: "Automations" },
  { to: "/wellness", label: "Wellness" },
  { to: "/profile", label: "Profile" },
  { to: "/settings", label: "Settings" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <>
      <Header aria-label="Cortex">
        <SkipToContent />
        <HeaderName as={Link} to="/today" prefix="📓">
          Cortex
        </HeaderName>
        <HeaderNavigation aria-label="Cortex nav">
          {NAV.map((item) => (
            <HeaderMenuItem
              key={item.to}
              as={Link}
              to={item.to}
              isActive={pathname.startsWith(item.to)}
            >
              {item.label}
            </HeaderMenuItem>
          ))}
        </HeaderNavigation>
      </Header>
      <Content style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>{children}</Content>
    </>
  );
}
