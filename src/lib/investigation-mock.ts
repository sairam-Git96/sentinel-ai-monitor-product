// Mock data for the Investigation Module.
import type { Severity } from "./mock-data";

export type InvCaseStatus =
  | "Open"
  | "Under Investigation"
  | "AI Running"
  | "Escalated"
  | "Resolved"
  | "False Positive"
  | "Closed";

export type AnomalyType =
  | "Fraud Spike"
  | "Approval Rate Drop"
  | "Country Anomaly"
  | "MCC Anomaly"
  | "Volume Spike"
  | "Authentication Failure"
  | "Decline Surge"
  | "Gateway Latency";

export type InvestigationType = "AI-Led" | "Analyst-Led" | "Hybrid";

export type SlaStatus = "On Track" | "At Risk" | "Breached";

export const INV_STEPS = [
  "Data Collection",
  "Pattern Analysis",
  "Historical Comparison",
  "Root Cause Analysis",
  "Impact Assessment",
  "Similar Incident Search",
  "Recommendation Generation",
  "Final Conclusion",
] as const;
export type InvStep = (typeof INV_STEPS)[number];

export interface RootCauseProb {
  cause: string;
  probability: number;
}

export interface TimelineEvent {
  time: string;
  label: string;
}

export interface InvestigationCase {
  id: string;
  alertId: string;
  anomalyType: AnomalyType;
  severity: Severity;
  status: InvCaseStatus;
  assignedTo: string;
  aiConfidence: number; // 0-100
  riskScore: number; // 0-100
  txnImpact: number; // count
  financialImpact: number; // USD
  created: string;
  updated: string;
  sla: SlaStatus;
  country: string;
  mcc: string;
  channel: string;
  priority: Severity;
  investigationType: InvestigationType;
  progress: number; // 0-100
  currentStep: InvStep;
  rootCauses: RootCauseProb[];
  findings: string[];
  reasonsFlagged: string[];
  evidence: string[];
  recommendations: string[];
  timeline: TimelineEvent[];
  notes: { author: string; at: string; text: string }[];
}

const COUNTRIES = ["USA", "UK", "India", "Canada", "Singapore", "Germany", "Brazil"];
const MCCS = ["Grocery", "Travel", "Fuel", "Retail", "Entertainment", "Healthcare", "Gaming"];
const CHANNELS = ["POS", "E-Commerce", "Mobile", "ATM"];
const ANALYSTS = ["Emily Johnson", "Michael Brown", "Sophia Davis", "David Wilson", "James Taylor", "Robert Lee", "Olivia Martinez", "Unassigned"];
const TYPES: AnomalyType[] = ["Fraud Spike", "Approval Rate Drop", "Country Anomaly", "MCC Anomaly", "Volume Spike", "Authentication Failure", "Decline Surge", "Gateway Latency"];
const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];
const STATUSES: InvCaseStatus[] = ["Open", "Under Investigation", "AI Running", "Escalated", "Resolved", "False Positive", "Closed"];
const INV_TYPES: InvestigationType[] = ["AI-Led", "Analyst-Led", "Hybrid"];

const CAUSES_BY_TYPE: Record<AnomalyType, string[]> = {
  "Fraud Spike": ["Fraud Attack", "BIN Configuration Issue", "Authentication Failure", "Gateway Issue"],
  "Approval Rate Drop": ["Gateway Issue", "Issuer Outage", "MCC Configuration", "Network Outage"],
  "Country Anomaly": ["Geographic Anomaly", "Fraud Attack", "BIN Configuration Issue", "Operational Error"],
  "MCC Anomaly": ["MCC Configuration", "Merchant System Failure", "Operational Error", "Fraud Attack"],
  "Volume Spike": ["Marketing Event", "Fraud Attack", "Merchant System Failure", "Gateway Issue"],
  "Authentication Failure": ["Authentication Failure", "3DS Misconfiguration", "Issuer Outage", "Network Outage"],
  "Decline Surge": ["Issuer Outage", "Gateway Issue", "BIN Configuration Issue", "Fraud Attack"],
  "Gateway Latency": ["Gateway Issue", "Network Outage", "Merchant System Failure", "Operational Error"],
};

let seed = 1337;
function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
function pick<T>(a: T[]): T { return a[Math.floor(rand() * a.length)]; }
function int(min: number, max: number) { return Math.floor(rand() * (max - min + 1)) + min; }

function buildRootCauses(type: AnomalyType): RootCauseProb[] {
  const causes = CAUSES_BY_TYPE[type];
  const top = int(55, 85);
  const second = int(8, Math.max(9, Math.floor((100 - top) * 0.6)));
  const third = int(3, Math.max(4, Math.floor((100 - top - second) * 0.7)));
  const other = Math.max(0, 100 - top - second - third);
  return [
    { cause: causes[0], probability: top },
    { cause: causes[1], probability: second },
    { cause: causes[2], probability: third },
    { cause: causes[3] ?? "Other", probability: other },
  ];
}

function buildTimeline(created: Date, progress: number): TimelineEvent[] {
  const t0 = created.getTime();
  const labels = [
    "Anomaly Detected",
    "Case Created",
    "AI Investigation Started",
    "Historical Analysis Completed",
    "Root Cause Identified",
    "Recommendations Generated",
    "Analyst Review Started",
    "Case Updated",
  ];
  const events: TimelineEvent[] = [];
  const steps = Math.max(2, Math.ceil((progress / 100) * labels.length));
  for (let i = 0; i < steps; i++) {
    const ts = new Date(t0 + i * int(2, 9) * 60_000);
    events.push({
      time: ts.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      label: labels[i],
    });
  }
  return events;
}

const FINDINGS_BY_TYPE: Record<AnomalyType, string[]> = {
  "Fraud Spike": ["Card-not-present fraud above 3-sigma", "Repeated BIN attack from 4 IP ranges", "High velocity attempts on test merchants"],
  "Approval Rate Drop": ["Approval rate dropped 18.7% vs baseline", "Spike in 05/51 decline codes", "Latency on issuer X exceeded 2.1s"],
  "Country Anomaly": ["Unusual volume from non-baseline country", "Card BIN inconsistent with geo IP", "Cross-border fraud markers elevated"],
  "MCC Anomaly": ["MCC distribution skew vs 30-day mean", "New MCC seen with high decline rate", "Gaming MCC volume up 240%"],
  "Volume Spike": ["Hourly volume above 4-sigma", "Concentrated to 6 merchants", "Marketing event not on calendar"],
  "Authentication Failure": ["3DS challenge abandonment rose 22%", "Frictionless rate dropped sharply", "Issuer ACS errors elevated"],
  "Decline Surge": ["Soft declines 41% above baseline", "Concentration on issuer cluster B", "Retry rate exceeds safe threshold"],
  "Gateway Latency": ["p95 latency at 2.8s vs 0.6s baseline", "Timeouts above SLO budget", "Affected region: APAC"],
};

const REASONS = [
  "Approval Rate Drop",
  "Fraud Spike",
  "MCC Variance",
  "Country Shift",
  "Channel Shift",
  "Volume Spike",
];

const EVIDENCE = [
  "7-day rolling baseline comparison",
  "Similar incident: 2024-03-11 gateway outage",
  "Issuer health telemetry attached",
  "Velocity rules triggered (RULE-42, RULE-77)",
  "BIN risk score in top decile",
];

const RECS = [
  "Monitor transactions for next 24 hours",
  "Escalate to Fraud Team",
  "Contact Gateway Provider",
  "Block suspicious merchants",
  "Increase fraud monitoring threshold",
  "Review authentication configurations",
];

function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  }
  return out;
}

export function generateInvestigationCases(n = 50): InvestigationCase[] {
  seed = 1337;
  const out: InvestigationCase[] = [];
  const now = Date.now();
  for (let i = 0; i < n; i++) {
    const type = pick(TYPES);
    const sev = i < 5 ? "Critical" : i < 14 ? "High" : i < 32 ? "Medium" : "Low";
    const status = pick(STATUSES);
    const progress =
      status === "Closed" || status === "Resolved" || status === "False Positive"
        ? 100
        : status === "Open"
          ? int(5, 25)
          : int(30, 95);
    const created = new Date(now - int(1, 30) * 86400000 - int(0, 86400) * 1000);
    const updated = new Date(created.getTime() + int(10, 720) * 60_000);
    const rcs = buildRootCauses(type);
    const stepIdx = Math.min(INV_STEPS.length - 1, Math.floor((progress / 100) * INV_STEPS.length));
    const id = `INV-${(1000 + i).toString()}`;
    out.push({
      id,
      alertId: `ALT-${(2000 + i).toString()}`,
      anomalyType: type,
      severity: sev as Severity,
      status,
      assignedTo: pick(ANALYSTS),
      aiConfidence: int(55, 98),
      riskScore: int(20, 99),
      txnImpact: int(120, 48000),
      financialImpact: int(2_500, 850_000),
      created: created.toISOString(),
      updated: updated.toISOString(),
      sla: pick(["On Track", "On Track", "At Risk", "Breached"]) as SlaStatus,
      country: pick(COUNTRIES),
      mcc: pick(MCCS),
      channel: pick(CHANNELS),
      priority: sev as Severity,
      investigationType: pick(INV_TYPES),
      progress,
      currentStep: INV_STEPS[stepIdx],
      rootCauses: rcs,
      findings: FINDINGS_BY_TYPE[type],
      reasonsFlagged: sample(REASONS, 3),
      evidence: sample(EVIDENCE, 3),
      recommendations: sample(RECS, 4),
      timeline: buildTimeline(created, progress),
      notes: [
        { author: "AI Copilot", at: created.toLocaleString(), text: `Initial triage complete for ${type.toLowerCase()}.` },
      ],
    });
  }
  return out;
}

export function avgResolutionHours(cases: InvestigationCase[]): number {
  const closed = cases.filter((c) => c.status === "Resolved" || c.status === "Closed");
  if (!closed.length) return 0;
  const total = closed.reduce((acc, c) => acc + (new Date(c.updated).getTime() - new Date(c.created).getTime()), 0);
  return Math.round(total / closed.length / 3_600_000);
}