// Carbon Header + side nav. Phase 1 work for M3.

import {
  Content,
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  SkipToContent,
} from "@carbon/react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV = [
  { to: "/timeline", label: "Timeline" },
  { to: "/search", label: "Search" },
  { to: "/settings", label: "Settings" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <>
      <Header aria-label="Cortex">
        <SkipToContent />
        <HeaderName as={Link} to="/timeline" prefix="📓">
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
      <Content style={{ padding: "2rem" }}>{children}</Content>
    </>
  );
}
