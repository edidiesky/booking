export type StatTone = "success" | "warning" | "danger" | "neutral" | "info";

export type StatCardProps = {
  label: string;
  value: string | number;
  total?: string;
  /** 0–1 */
  progress: number;
  tone?: StatTone;
  footnote?: string;
};