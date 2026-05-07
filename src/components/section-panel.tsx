export function SectionPanel({
  title,
  description,
  action,
  children,
  className
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className ?? ""}`}>
      {(title || description || action) && (
        <div className="panel-header">
          <div className="panel-title-group">
            {title ? <h2 className="section-title">{title}</h2> : null}
            {description ? <p className="page-subtitle">{description}</p> : null}
          </div>
          {action ? <div className="panel-action">{action}</div> : null}
        </div>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}
