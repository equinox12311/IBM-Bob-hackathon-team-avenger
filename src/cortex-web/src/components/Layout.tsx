import {
  Content,
  Header,
  HeaderMenuButton,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  HeaderSideNavItems,
  SideNav,
  SideNavItems,
  SideNavLink,
  SkipToContent,
} from "@carbon/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
  icon: string; // Material Symbol name
  primary?: boolean; // shown on the bottom nav
}

const NAV: NavItem[] = [
  { to: "/today", label: "Today", icon: "today", primary: true },
  { to: "/timeline", label: "Timeline", icon: "view_timeline" },
  { to: "/search", label: "Search", icon: "search", primary: true },
  { to: "/ideas", label: "Ideas", icon: "lightbulb", primary: true },
  { to: "/debug", label: "Debug", icon: "bug_report" },
  { to: "/report", label: "Report", icon: "summarize" },
  { to: "/analytics", label: "Analytics", icon: "monitoring" },
  { to: "/productivity", label: "ROI", icon: "savings" },
  { to: "/github", label: "GitHub", icon: "code" },
  { to: "/automations", label: "Automations", icon: "bolt" },
  { to: "/wellness", label: "Wellness", icon: "spa" },
  { to: "/identity", label: "Identity", icon: "account_tree" },
  { to: "/news", label: "News", icon: "newspaper" },
  { to: "/profile", label: "Profile", icon: "person", primary: true },
  { to: "/settings", label: "Settings", icon: "settings" },
];

const PRIMARY = NAV.filter((n) => n.primary);

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const isActive = (to: string) => pathname.startsWith(to);

  return (
    <>
      <Header aria-label="Cortex">
        <SkipToContent />
        <HeaderMenuButton
          aria-label={sideNavOpen ? "Close menu" : "Open menu"}
          isCollapsible
          onClick={() => setSideNavOpen((v) => !v)}
          isActive={sideNavOpen}
        />
        <HeaderName as={Link} to="/today" prefix="📓">
          Cortex
        </HeaderName>
        <HeaderNavigation aria-label="Cortex nav">
          {NAV.map((item) => (
            <HeaderMenuItem
              key={item.to}
              as={Link}
              to={item.to}
              isActive={isActive(item.to)}
            >
              {item.label}
            </HeaderMenuItem>
          ))}
        </HeaderNavigation>
        <SideNav
          aria-label="Side navigation"
          expanded={sideNavOpen}
          isPersistent={false}
          onSideNavBlur={() => setSideNavOpen(false)}
        >
          <SideNavItems>
            <HeaderSideNavItems>
              {NAV.map((item) => (
                <HeaderMenuItem
                  key={item.to}
                  as={Link}
                  to={item.to}
                  isActive={isActive(item.to)}
                  onClick={() => setSideNavOpen(false)}
                >
                  {item.label}
                </HeaderMenuItem>
              ))}
            </HeaderSideNavItems>
            {NAV.map((item) => (
              <SideNavLink
                key={`s-${item.to}`}
                as={Link as any}
                to={item.to}
                isActive={isActive(item.to)}
                onClick={() => setSideNavOpen(false)}
              >
                {item.label}
              </SideNavLink>
            ))}
          </SideNavItems>
        </SideNav>
      </Header>
      <Content className="cortex-content">
        <div className="cortex-page">{children}</div>
      </Content>

      {/* Mobile bottom-tab nav (visible at < 1056px) */}
      <nav className="cortex-bottom-nav" aria-label="Quick navigation">
        {PRIMARY.map((item) => (
          <NavLink
            key={`b-${item.to}`}
            to={item.to}
            className={({ isActive: a }) => (a ? "active" : undefined)}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
