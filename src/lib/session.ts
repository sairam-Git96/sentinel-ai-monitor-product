// Lightweight client-side session/role helper for the Sentinel AI demo.
// Persists the selected demo role in localStorage so the app shell,
// route guards, and badges can react to it.

export type Role =
  | "super_admin"
  | "risk_analyst"
  | "fraud_investigator"
  | "ops_manager"
  | "compliance_officer"
  | "executive";

export type Permission =
  | "dashboard"
  | "transactions"
  | "anomalies"
  | "rca"
  | "assistant"
  | "cases"
  | "incidents"
  | "fraud"
  | "reports"
  | "executive"
  | "investigation"
  | "users"
  | "roles"
  | "audit"
  | "settings"
  | "help";

export type RoleDef = {
  value: Role;
  label: string;
  short: string;
  description: string;
  permissions: Permission[] | "all";
  activities: string[];
};

export const ROLES: RoleDef[] = [
  {
    value: "super_admin",
    label: "Super Admin",
    short: "Admin",
    description:
      "Full platform owner. Manages users, roles, system configuration, and has unrestricted access to every module.",
    permissions: "all",
    activities: ["Reviewing access requests", "Auditing role changes", "Monitoring platform health"],
  },
  {
    value: "risk_analyst",
    label: "Risk Analyst",
    short: "Analyst",
    description:
      "Monitors transaction health metrics, investigates anomalies, reviews AI insights, and initiates corrective actions.",
    permissions: ["dashboard", "transactions", "anomalies", "rca", "assistant", "cases", "reports", "investigation", "help"],
    activities: ["Reviewing Anomalies", "Monitoring Approval Rate", "Triaging AI Insights"],
  },
  {
    value: "fraud_investigator",
    label: "Fraud Investigator",
    short: "Investigator",
    description:
      "Owns end-to-end fraud cases. Investigates attack vectors, links incidents to cases, and coordinates response.",
    permissions: ["dashboard", "anomalies", "fraud", "cases", "incidents", "assistant", "investigation", "help"],
    activities: ["Investigating Fraud Spike", "Building Case File", "Linking Incidents"],
  },
  {
    value: "ops_manager",
    label: "Operations Manager",
    short: "Operations",
    description:
      "Oversees authorization performance, vendor health, and operational incidents across regions and channels.",
    permissions: ["dashboard", "transactions", "incidents", "reports", "executive", "investigation", "help"],
    activities: ["Monitoring Issuer Latency", "Reviewing Decline Codes", "Creating Incident Report"],
  },
  {
    value: "compliance_officer",
    label: "Compliance Officer",
    short: "Compliance",
    description:
      "Ensures regulatory adherence. Reviews audit trails, case dispositions, and controls evidence retention.",
    permissions: ["dashboard", "cases", "audit", "reports", "investigation", "help"],
    activities: ["Reviewing Audit Logs", "Validating Case Closure", "Preparing Regulatory Report"],
  },
  {
    value: "executive",
    label: "Executive Viewer",
    short: "Executive",
    description:
      "Read-only access to executive KPIs, fraud trends, and high-level reports across the platform.",
    permissions: ["dashboard", "executive", "reports", "help"],
    activities: ["Reviewing Executive KPIs", "Tracking Loss Trends", "Reviewing Weekly Report"],
  },
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  dashboard: "Dashboard Access",
  transactions: "Transaction Monitoring",
  anomalies: "Anomaly Detection",
  rca: "Root Cause Analysis",
  assistant: "AI Assistant",
  cases: "Case Management",
  incidents: "Incident Management",
  fraud: "Fraud Analytics",
  reports: "Reports & Analytics",
  executive: "Executive Dashboard",
  investigation: "Investigation Module",
  users: "User Management",
  roles: "Role Management",
  audit: "Audit Logs",
  settings: "Settings",
  help: "Help Center",
};

const KEY = "sentinel.session";

export type Session = { email: string; role: Role; loginAt: number };

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Omit<Session, "loginAt"> & { loginAt?: number }) {
  if (typeof window === "undefined") return;
  const next: Session = { ...s, loginAt: s.loginAt ?? Date.now() };
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  // Best-effort clear of any cached user data the demo may have written.
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith("sentinel."))
      .forEach((k) => window.localStorage.removeItem(k));
    window.sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

export function getRoleDef(role: Role | undefined | null): RoleDef {
  return ROLES.find((r) => r.value === role) ?? ROLES[0];
}

export function roleLabel(role: Role | undefined | null): string {
  return getRoleDef(role).label;
}

export function hasPermission(role: Role | undefined | null, perm: Permission): boolean {
  const def = getRoleDef(role);
  return def.permissions === "all" || def.permissions.includes(perm);
}

export function formatLastLogin(ts: number | undefined | null): string {
  if (!ts) return "Just now";
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
