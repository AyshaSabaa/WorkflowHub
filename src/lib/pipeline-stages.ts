export const SALES_PIPELINE_STAGES = [
  { name: "Prospect", slug: "prospect", color: "#3b82f6", position: 0 },
  { name: "Initial Contact", slug: "initial_contact", color: "#f97316", position: 1 },
  { name: "Demo & Discussion", slug: "demo_discussion", color: "#8b5cf6", position: 2 },
  { name: "Documentation", slug: "documentation", color: "#eab308", position: 3 },
  { name: "Deal Closed", slug: "deal_closed", color: "#22c55e", position: 4 },
] as const;

export type PipelineStageSlug = (typeof SALES_PIPELINE_STAGES)[number]["slug"];

export function columnStatus(column: { slug?: string | null; name: string }): string {
  return column.slug || column.name;
}

export function isDealClosedStage(column: { slug?: string | null; name: string }): boolean {
  return column.slug === "deal_closed";
}

export function getStageLabel(status: string): string {
  const stage = SALES_PIPELINE_STAGES.find((s) => s.slug === status);
  return stage?.name ?? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getProspectColumnId(columns: { id: string; slug?: string | null; name: string }[]): string {
  return columns.find((c) => c.slug === "prospect")?.id ?? columns[0]?.id ?? "";
}
