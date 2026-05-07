import Tooltip from "@atlaskit/tooltip";

export function MetricCard({
  label,
  value,
  change,
  helper,
  status,
  tooltip
}: {
  label: string;
  value: string | number;
  change?: string;
  helper: string;
  status?: "good" | "watch" | "risk";
  tooltip?: string;
}) {
  const content = (
    <section className={`metric-card${status ? ` metric-card-${status}` : ""}`}>
      <div className="metric-card-topline">
        <span className="metric-label">{label}</span>
        {status ? (
          <span className={`metric-status metric-status-${status}`}>
            <span aria-hidden="true" />
            {status === "good" ? "Healthy" : status === "watch" ? "Watch" : "Risk"}
          </span>
        ) : null}
      </div>
      <div className="metric-card-value-row">
        <strong className="metric-value">{value}</strong>
        {change ? <span className={`metric-change${change.startsWith("-") ? " is-negative" : ""}`}>{change}</span> : null}
      </div>
      <span className="metric-helper">{helper}</span>
    </section>
  );

  return tooltip ? <Tooltip content={tooltip}>{content}</Tooltip> : content;
}
