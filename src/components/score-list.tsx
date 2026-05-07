import type { OpportunityScore } from "@/lib/types";

const scoreLabels: Array<[keyof OpportunityScore, string]> = [
  ["relevanceScore", "Relevance"],
  ["intentScore", "Intent"],
  ["productFitScore", "Product fit"],
  ["engagementValueScore", "Engagement value"],
  ["promotionRiskScore", "Promotion risk"],
  ["communityRiskScore", "Community risk"],
  ["accountSafetyScore", "Account safety"],
  ["responseConfidenceScore", "Response confidence"]
];

export function ScoreList({ scores }: { scores: OpportunityScore }) {
  return (
    <div className="score-list">
      {scoreLabels.map(([key, label]) => (
        <div className="score-row" key={key}>
          <div>
            <div className="small-text">{label}</div>
            <div className="score-bar" aria-hidden="true">
              <div className="score-fill" style={{ width: `${scores[key]}%` }} />
            </div>
          </div>
          <strong>{scores[key]}</strong>
        </div>
      ))}
    </div>
  );
}
