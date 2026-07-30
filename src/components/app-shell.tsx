"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProjectIcon from "@atlaskit/icon/core/project";
import SearchIcon from "@atlaskit/icon/core/search";
import InboxIcon from "@atlaskit/icon/core/inbox";
import EditIcon from "@atlaskit/icon/core/edit";
import LightbulbIcon from "@atlaskit/icon/core/lightbulb";
import LockIcon from "@atlaskit/icon/core/lock-locked";
import ChartIcon from "@atlaskit/icon/core/chart-bar";
import SettingsIcon from "@atlaskit/icon/core/settings";
import TargetIcon from "@atlaskit/icon/core/target";
import { useReydar } from "@/lib/store";

const navItems = [
  { href: "/projects", label: "Projects", shortLabel: "Projects", icon: ProjectIcon },
  { href: "/signal-discovery", label: "Autonomous Pipeline", shortLabel: "Pipeline", icon: SearchIcon },
  { href: "/opportunities", label: "Review Inbox", shortLabel: "Review", icon: InboxIcon },
  { href: "/response-studio", label: "Review Studio", shortLabel: "Studio", icon: EditIcon },
  { href: "/autonomy-policies", label: "Autonomy Controls", shortLabel: "Controls", icon: LockIcon },
  { href: "/action-log", label: "Audit Log", shortLabel: "Audit", icon: ChartIcon },
  { href: "/market-insights", label: "Market Memory", shortLabel: "Memory", icon: LightbulbIcon },
  { href: "/analytics", label: "Analytics", shortLabel: "Analytics", icon: ChartIcon },
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: SettingsIcon }
];

const primaryMobileHrefs = new Set(["/projects", "/signal-discovery", "/opportunities", "/response-studio", "/action-log"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, activeProject } = useReydar();
  const highPriority = state.opportunities.filter(
    (opportunity) => opportunity.scores.intentScore >= 75 && opportunity.riskLevel !== "high"
  ).length;
  const activeProjectOpportunities = state.opportunities.filter((item) => item.projectId === activeProject.id).length;
  const activeProjectHref = activeProject.id ? `/projects/${activeProject.id}` : "/projects";
  const mobilePrimaryItems = navItems.filter((item) => primaryMobileHrefs.has(item.href));
  const mobileSecondaryItems = navItems.filter((item) => !primaryMobileHrefs.has(item.href));

  const isSelected = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to main content</a>
      <aside className="app-sidebar" aria-label="Primary navigation">
        <div className="side-nav-frame">
          <Link className="sidebar-brand" href="/" aria-label="ReydarOS dashboard">
            <span className="brand-mark" aria-hidden="true">R</span>
            <span className="brand-copy">
              <strong>ReydarOS</strong>
              <span>DARM command center</span>
            </span>
          </Link>

          <nav className="sidebar-nav" aria-label="Primary navigation">
            <span className="sidebar-section-label">Autonomous intelligence</span>
            {navItems.map((item) => {
              const selected = isSelected(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-link${selected ? " is-selected" : ""}`}
                  aria-current={selected ? "page" : undefined}
                >
                  <Icon label="" />
                  <span>{item.label}</span>
                  {item.href === "/opportunities" && highPriority ? <span className="count-pill">{highPriority}</span> : null}
                </Link>
              );
            })}
          </nav>

          <Link className="active-project-card" href={activeProjectHref}>
            <span className="active-project-icon" aria-hidden="true">
              <TargetIcon label="" />
            </span>
            <span>
              <span className="sidebar-section-label">Active project</span>
              <strong>{activeProject.name}</strong>
              <span>{activeProjectOpportunities} open signal{activeProjectOpportunities === 1 ? "" : "s"}</span>
            </span>
          </Link>
        </div>
      </aside>
      <div className="app-main">
        <header className="mobile-app-header">
          <div className="mobile-toolbar">
            <Link className="mobile-brand" href="/" aria-label="ReydarOS dashboard">
              <span className="brand-mark" aria-hidden="true">R</span>
              <span className="brand-copy">
                <strong>ReydarOS</strong>
                <span>DARM command center</span>
              </span>
            </Link>
            <Link className="mobile-active-project" href={activeProjectHref}>
              <TargetIcon label="" />
              <span>{activeProject.name}</span>
            </Link>
            <details className="mobile-more-menu">
              <summary>More</summary>
              <div className="mobile-more-popover">
                {mobileSecondaryItems.map((item) => {
                  const selected = isSelected(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`mobile-more-link${selected ? " is-selected" : ""}`}
                      aria-current={selected ? "page" : undefined}
                    >
                      <Icon label="" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </details>
          </div>
        </header>
        <main className="main-scroll" id="main">
          <div className="page-content">{children}</div>
        </main>
        <nav className="mobile-tab-bar" aria-label="Primary navigation">
          {mobilePrimaryItems.map((item) => {
            const selected = isSelected(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-tab-link${selected ? " is-selected" : ""}`}
                aria-current={selected ? "page" : undefined}
              >
                <span className="mobile-tab-icon">
                  <Icon label="" />
                  {item.href === "/opportunities" && highPriority ? <span className="tab-badge">{highPriority}</span> : null}
                </span>
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
