import Link from "next/link";
import { ProjectSwitcher } from "@/components/project-switcher";

export function PageHeading({
  title,
  description,
  breadcrumbs,
  action,
  showProjectSwitcher = true
}: {
  title: string;
  description: string;
  breadcrumbs?: { text: string; href: string }[];
  action?: React.ReactNode;
  showProjectSwitcher?: boolean;
}) {
  return (
    <header className="page-heading">
      {breadcrumbs?.length ? (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((item, index) => (
            <span className="breadcrumb-item" key={item.href}>
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              <Link href={item.href}>{item.text}</Link>
            </span>
          ))}
        </nav>
      ) : null}
      <div className="page-heading-row">
        <div className="page-heading-main">
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{description}</p>
        </div>
        <div className="page-heading-actions">
          {showProjectSwitcher ? <ProjectSwitcher /> : null}
          {action}
        </div>
      </div>
    </header>
  );
}
