import type { KnowledgeHealth, KnowledgeItem, ReydarState, RiskLevel } from "@/lib/types";

export function projectName(state: ReydarState, projectId: string) {
  return state.projects.find((project) => project.id === projectId)?.name ?? "Unknown project";
}

export function projectHealth(items: KnowledgeItem[]): KnowledgeHealth {
  if (items.length === 0) return "missing";
  const approved = items.filter((item) => item.status === "approved").length;
  if (approved >= 3) return "strong";
  if (approved >= 1) return "needs_review";
  return "sparse";
}

export function strongestRisk(values: RiskLevel[]): RiskLevel {
  if (values.includes("blocked")) return "blocked";
  if (values.includes("high")) return "high";
  if (values.includes("medium")) return "medium";
  return "low";
}

export function topCounts(values: string[], limit = 5) {
  return Object.entries(
    values.reduce<Record<string, number>>((acc, value) => {
      const key = value || "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}
