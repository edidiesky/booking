export type ActionVisual = {
  label: string;
  color: string;
  bg: string;
  icon:
    | "plus"
    | "pencil"
    | "trash"
    | "ban"
    | "flag"
    | "check"
    | "mail"
    | "x"
    | "refresh"
    | "dot";
};

const ACTION_MAP: Record<string, ActionVisual> = {
  created: { label: "Created", color: "#166534", bg: "#dcfce7", icon: "plus" },
  updated: {
    label: "Updated",
    color: "#1e40af",
    bg: "#dbeafe",
    icon: "pencil",
  },
  deleted: { label: "Deleted", color: "#991b1b", bg: "#fee2e2", icon: "trash" },
  suspended: {
    label: "Suspended",
    color: "#9a3412",
    bg: "#ffedd5",
    icon: "ban",
  },
  deactivated: {
    label: "Deactivated",
    color: "#9a3412",
    bg: "#ffedd5",
    icon: "ban",
  },
  reactivated: {
    label: "Reactivated",
    color: "#166534",
    bg: "#dcfce7",
    icon: "refresh",
  },
  invited: { label: "Invited", color: "#6b21a8", bg: "#f3e8ff", icon: "mail" },
  flagged: { label: "Flagged", color: "#9a3412", bg: "#ffedd5", icon: "flag" },
  cancelled: { label: "Cancelled", color: "#991b1b", bg: "#fee2e2", icon: "x" },
  canceled: { label: "Cancelled", color: "#991b1b", bg: "#fee2e2", icon: "x" },
  confirmed: {
    label: "Confirmed",
    color: "#166534",
    bg: "#dcfce7",
    icon: "check",
  },
  status_changed: {
    label: "Updated",
    color: "#1e40af",
    bg: "#dbeafe",
    icon: "pencil",
  },
  login: { label: "Login", color: "#374151", bg: "#f3f4f6", icon: "dot" },
  logout: { label: "Logout", color: "#374151", bg: "#f3f4f6", icon: "dot" },
};

export function parseAction(action: string): {
  verb: string;
  resource: string;
  visual: ActionVisual;
} {
  const raw = (action || "").trim();
  const parts = raw.split(/[.:]/).filter(Boolean);
  const last = (parts[parts.length - 1] || raw).toLowerCase();
  const resourcePart =
    parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] || "record";

  const visual =
    ACTION_MAP[last] ??
    ({
      label: last ? last.charAt(0).toUpperCase() + last.slice(1) : "Action",
      color: "#374151",
      bg: "#f3f4f6",
      icon: "dot",
    } satisfies ActionVisual);

  const resource = resourcePart
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return { verb: last, resource, visual };
}

export function titleFromAction(action: string): string {
  const { visual, resource } = parseAction(action);
  return `${visual.label} ${resource}`;
}
