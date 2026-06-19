// Mock data generator for Sentinel AI
export type Severity = "Critical" | "High" | "Medium" | "Low";
export type Status = "Open" | "Investigating" | "Escalated" | "Resolved" | "Closed";

export interface Anomaly {
  id: string;
  timestamp: string;
  metric: string;
  severity: Severity;
  country: string;
  mcc: string;
  channel: string;
  impact: number;
  status: Status;
  description: string;
  confidence: number;
  rootCauses: string[];
  recommendations: string[];
  affectedTxns: number;
}

export interface Investigation {
  id: string;
  name: string;
  assignee: string;
  priority: Severity;
  status: Status;
  created: string;
  notes: string;
  anomalyId: string;
}

export interface NotificationItem {
  id: string;
  type: "fraud" | "approval" | "merchant" | "case" | "system";
  title: string;
  body: string;
  time: string;
  severity: Severity;
  read: boolean;
}

export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
}

export interface TrendPoint {
  date: string;
  approval: number;
  decline: number;
  fraud: number;
  volume: number;
  revenue: number;
}

const COUNTRIES = ["USA", "UK", "India", "Canada", "Singapore"];
const MCCS = ["Grocery", "Travel", "Fuel", "Retail", "Entertainment", "Healthcare"];
const CHANNELS = ["POS", "E-Commerce"];
const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];
const STATUSES: Status[] = ["Open", "Investigating", "Escalated", "Resolved", "Closed"];

const ANALYSTS = [
  "Emily Johnson", "Michael Brown", "Sophia Davis",
  "David Wilson", "James Taylor", "Robert Lee", "Olivia Martinez",
];

// Seeded RNG for stable demo data
let seed = 42;
function rand() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function int(min: number, max: number) { return Math.floor(rand() * (max - min + 1)) + min; }

function resetSeed() { seed = 42; }

export function generateTrend(days = 90): TrendPoint[] {
  resetSeed();
  const out: TrendPoint[] = [];
  const start = new Date();
  start.setDate(start.getDate() - days);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const base = 92 + Math.sin(i / 7) * 2 + rand() * 2;
    // Inject a dip near the end
    const dip = i === days - 5 ? -8 : i === days - 4 ? -5 : 0;
    const approval = Math.max(70, Math.min(99, base + dip));
    const decline = 100 - approval;
    const fraud = 0.18 + Math.abs(Math.sin(i / 11)) * 0.15 + (i === days - 3 ? 0.4 : 0) + rand() * 0.05;
    const volume = Math.round(650000 + Math.sin(i / 5) * 80000 + rand() * 40000);
    const revenue = Math.round(volume * (45 + rand() * 20));
    out.push({
      date: d.toISOString().slice(0, 10),
      approval: +approval.toFixed(2),
      decline: +decline.toFixed(2),
      fraud: +fraud.toFixed(3),
      volume,
      revenue,
    });
  }
  return out;
}

const ANOMALY_TEMPLATES = [
  { metric: "Approval Rate Drop", desc: "Approval rate dropped sharply driven by issuer timeout declines." },
  { metric: "Fraud Spike", desc: "Fraud rate exceeded threshold on E-Commerce 3DS-bypass attempts." },
  { metric: "Transaction Surge", desc: "Unusual volume surge detected, likely promotional campaign." },
  { metric: "Issuer Timeout Spike", desc: "Issuer authorization gateway latency above SLA." },
  { metric: "Merchant Gateway Failure", desc: "Single merchant generating elevated 91 response codes." },
  { metric: "POS Authorization Failure", desc: "POS terminal cluster returning network errors." },
  { metric: "Country Specific Fraud Increase", desc: "Localized fraud pattern affecting one BIN range." },
  { metric: "Network Outage Impact", desc: "Network connectivity degradation impacting authorizations." },
  { metric: "Decline Rate Anomaly", desc: "Decline rate above 3-sigma against historical mean." },
  { metric: "MCC Risk Elevation", desc: "MCC risk score elevated due to chargeback velocity." },
];

const ROOT_CAUSES = [
  "Issuer authorization gateway latency",
  "3DS challenge step-up failures",
  "BIN range velocity rule misfire",
  "Merchant acquirer reroute",
  "Network connectivity degradation",
  "Card-not-present fraud pattern",
  "Decline reason code 91 (issuer unavailable)",
  "Risk model threshold drift",
];

const RECOMMENDATIONS = [
  "Review issuer authorization gateway health and failover.",
  "Increase monitoring frequency for affected MCC/country.",
  "Validate 3DS challenge flow with merchant.",
  "Tune velocity rules to reduce false positives.",
  "Escalate to network operations for connectivity check.",
  "Engage merchant acquirer to confirm routing.",
  "Lower step-up threshold for high-risk BINs.",
];

export function generateAnomalies(n = 25): Anomaly[] {
  resetSeed();
  const out: Anomaly[] = [];
  const now = Date.now();
  for (let i = 0; i < n; i++) {
    const tpl = ANOMALY_TEMPLATES[i % ANOMALY_TEMPLATES.length];
    const sev: Severity = i < 4 ? "Critical" : i < 10 ? "High" : i < 18 ? "Medium" : "Low";
    out.push({
      id: `ANM-${(1000 + i).toString()}`,
      timestamp: new Date(now - int(0, 60 * 60 * 24 * 1000 * 30)).toISOString(),
      metric: tpl.metric,
      severity: sev,
      country: pick(COUNTRIES),
      mcc: pick(MCCS),
      channel: pick(CHANNELS),
      impact: int(50_000, 2_500_000),
      status: pick(STATUSES),
      description: tpl.desc,
      confidence: +(0.78 + rand() * 0.21).toFixed(2),
      rootCauses: Array.from({ length: 3 }, () => pick(ROOT_CAUSES)).filter((v, idx, arr) => arr.indexOf(v) === idx),
      recommendations: Array.from({ length: 3 }, () => pick(RECOMMENDATIONS)).filter((v, idx, arr) => arr.indexOf(v) === idx),
      affectedTxns: int(800, 95_000),
    });
  }
  return out;
}

export function generateInvestigations(anomalies: Anomaly[], n = 15): Investigation[] {
  resetSeed();
  return Array.from({ length: n }, (_, i) => {
    const a = anomalies[i % anomalies.length];
    return {
      id: `CASE-${(1 + i).toString().padStart(3, "0")}`,
      name: `${a.metric} — ${a.country} ${a.mcc}`,
      assignee: pick(ANALYSTS),
      priority: a.severity,
      status: pick(STATUSES),
      created: new Date(Date.now() - int(0, 30) * 86400000).toISOString(),
      notes: "Initial triage complete. Engaging issuer for further investigation.",
      anomalyId: a.id,
    };
  });
}

const NOTIF_TEMPLATES: Array<Pick<NotificationItem, "type" | "title" | "body" | "severity">> = [
  { type: "fraud", title: "Critical Fraud Spike Detected", body: "Fraud rate spiked in UK E-Commerce channel.", severity: "Critical" },
  { type: "approval", title: "Approval Rate Below Threshold", body: "USA Travel MCC approval rate at 82.4%.", severity: "High" },
  { type: "merchant", title: "Merchant Gateway Failure", body: "Merchant MID 4471 generating elevated declines.", severity: "High" },
  { type: "case", title: "Investigation Assigned", body: "CASE-007 assigned to Emily Johnson.", severity: "Medium" },
  { type: "case", title: "Case Resolved", body: "CASE-002 closed with mitigations applied.", severity: "Low" },
  { type: "system", title: "AI Explanation Generated", body: "New diagnostic report available for ANM-1003.", severity: "Low" },
];

export function generateNotifications(n = 50): NotificationItem[] {
  resetSeed();
  return Array.from({ length: n }, (_, i) => {
    const t = NOTIF_TEMPLATES[i % NOTIF_TEMPLATES.length];
    return {
      id: `NTF-${i + 1}`,
      ...t,
      time: new Date(Date.now() - i * 1000 * 60 * 27).toISOString(),
      read: i > 8,
    };
  });
}

const AUDIT_ACTIONS = [
  "Login", "Logout", "Report Download", "Case Assigned",
  "Case Updated", "Settings Changed", "AI Explanation Generated",
  "Anomaly Escalated", "Anomaly Resolved", "User Created",
];
const AUDIT_USERS = ["John Smith", ...ANALYSTS, "Sarah Thompson", "William Harris"];

export function generateAudit(n = 100): AuditEntry[] {
  resetSeed();
  // Spread events across ~90 days so time-range filters are meaningful.
  const span = 90 * 24 * 60 * 60 * 1000;
  const step = Math.max(60 * 1000, Math.floor(span / Math.max(1, n)));
  return Array.from({ length: n }, (_, i) => ({
    id: `LOG-${10000 + i}`,
    user: pick(AUDIT_USERS),
    action: pick(AUDIT_ACTIONS),
    target: pick(["CASE-001", "ANM-1003", "Dashboard", "Reports/Fraud", "User: olivia", "Settings"]),
    timestamp: new Date(Date.now() - i * step - int(0, step)).toISOString(),
    ip: `10.${int(0, 255)}.${int(0, 255)}.${int(0, 255)}`,
  }));
}

export function aggregateByCountry(trend: TrendPoint[]) {
  resetSeed();
  return COUNTRIES.map((c) => ({
    country: c,
    fraud: +(0.15 + rand() * 0.6).toFixed(2),
    volume: int(2_000_000, 18_000_000),
    approval: +(85 + rand() * 12).toFixed(1),
    risk: int(30, 95),
  }));
}

export function aggregateByMCC() {
  resetSeed();
  return MCCS.map((m) => ({
    mcc: m,
    fraud: +(0.1 + rand() * 0.8).toFixed(2),
    decline: +(2 + rand() * 12).toFixed(1),
    volume: int(900_000, 8_000_000),
    risk: int(25, 95),
  }));
}

export function aggregateByChannel() {
  resetSeed();
  return CHANNELS.map((c) => ({
    channel: c,
    approval: +(85 + rand() * 10).toFixed(1),
    fraud: +(0.2 + rand() * 0.5).toFixed(2),
    volume: int(8_000_000, 25_000_000),
  }));
}

export const AI_INSIGHTS = [
  "Approval rate in USA Travel dropped from 95.6% to 82.4% — issuer timeouts up 370%.",
  "Fraud rate in UK E-Commerce 3DS-bypass attempts increased 2.4× week-over-week.",
  "Merchant MID 4471 contributing 38% of all decline code 91 events today.",
  "Singapore POS volume is 18% above forecast — likely campaign-driven, not anomalous.",
  "Recommendation: re-tune velocity rules for BIN 414709 to reduce false positives.",
];

export const REPORTS = [
  { id: "RPT-01", name: "Executive Summary", desc: "Monthly executive KPIs and AI highlights.", updated: "2h ago", size: "1.2 MB" },
  { id: "RPT-02", name: "Fraud Report", desc: "Fraud trends across country, MCC, and channel.", updated: "5h ago", size: "2.8 MB" },
  { id: "RPT-03", name: "Approval Report", desc: "Approval rate analysis and decline drivers.", updated: "Today", size: "1.6 MB" },
  { id: "RPT-04", name: "Decline Report", desc: "Top decline reason codes and trends.", updated: "1d ago", size: "0.9 MB" },
  { id: "RPT-05", name: "Country Risk Report", desc: "Geographic risk profile across regions.", updated: "1d ago", size: "1.4 MB" },
  { id: "RPT-06", name: "Merchant Risk Report", desc: "Top risk merchants ranked by chargeback velocity.", updated: "2d ago", size: "1.8 MB" },
  { id: "RPT-07", name: "Channel Analysis", desc: "POS vs E-Commerce performance.", updated: "2d ago", size: "0.7 MB" },
  { id: "RPT-08", name: "Operational Health Report", desc: "Authorization gateway uptime and SLA.", updated: "3d ago", size: "1.1 MB" },
  { id: "RPT-09", name: "AI Diagnostics Report", desc: "Aggregated AI explanations and confidence.", updated: "3d ago", size: "2.2 MB" },
  { id: "RPT-10", name: "Quarterly Executive Report", desc: "Quarterly performance, fraud, and risk review.", updated: "1w ago", size: "4.5 MB" },
];

export const ASSISTANT_QA: Array<{ q: string; a: string }> = [
  {
    q: "Why did approval rate fall yesterday?",
    a: "Approval rate fell from 95.6% → 82.4% yesterday. Primary contributor: **Travel MCC in USA** where issuer timeout declines (code 91) increased **370%** between 14:00–18:00 UTC. Estimated revenue impact **$2.1M**. Confidence **92%**. Recommended action: engage issuer ops and enable failover routing.",
  },
  {
    q: "What caused fraud spike in UK?",
    a: "UK fraud spike was driven by **E-Commerce 3DS-bypass attempts** on a single BIN range (414709). Velocity rule mis-tune allowed **2.4× normal fraud attempts** to authorize. Recommendation: lower step-up threshold for BIN 414709 and notify issuer fraud ops.",
  },
  {
    q: "Show top decline drivers.",
    a: "Top decline drivers (last 24h):\n1. **Code 91 — Issuer unavailable** (42% of declines)\n2. **Code 05 — Do not honor** (21%)\n3. **Code 51 — Insufficient funds** (14%)\n4. **3DS step-up failures** (9%)\n5. **Velocity rule blocks** (7%)",
  },
  {
    q: "Explain anomaly in simple language.",
    a: "We detected that more card payments are being declined than usual. The bank's system that approves payments responded slowly, so many payments timed out and got rejected. This is most visible for travel purchases in the US. We've flagged it as a critical anomaly and notified the operations team.",
  },
  {
    q: "Which merchant caused highest losses?",
    a: "Merchant **MID 4471 — 'GlobalTrip Bookings'** caused the highest losses today: **$680K in declined transactions** and elevated chargeback velocity (3.2×). Recommendation: open a merchant performance review case.",
  },
];

// ====== Decline Reason Codes ======
export const DECLINE_CODES = [
  { code: "R01", label: "Insufficient funds" },
  { code: "R03", label: "Invalid merchant" },
  { code: "R05", label: "Do not honour" },
  { code: "R12", label: "Invalid transaction" },
  { code: "R14", label: "Invalid card number" },
  { code: "R51", label: "Exceeds withdrawal limit" },
  { code: "R54", label: "Expired card" },
  { code: "R91", label: "Issuer unavailable / timeout" },
  { code: "R96", label: "System malfunction" },
] as const;

export interface DeclineBreakdownItem { code: string; label: string; share: number; change: number; }

export function declineBreakdownFor(anomalyId: string): DeclineBreakdownItem[] {
  // deterministic seed from anomaly id
  let s = 0;
  for (const c of anomalyId) s = (s * 31 + c.charCodeAt(0)) % 1_000_003;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  // build weighted shares
  const weights = DECLINE_CODES.map(() => r());
  const total = weights.reduce((a, b) => a + b, 0);
  const items = DECLINE_CODES.map((c, i) => ({
    code: c.code,
    label: c.label,
    share: +((weights[i] / total) * 100).toFixed(1),
    change: +((r() * 400) - 30).toFixed(0), // -30 to +370
  })).sort((a, b) => b.share - a.share);
  // anomaly types often have R91 dominant — boost R91 if metric includes timeout/approval
  return items;
}

export function topDeclineReasons(): DeclineBreakdownItem[] {
  return [
    { code: "R91", label: "Issuer unavailable / timeout", share: 42.0, change: 370 },
    { code: "R05", label: "Do not honour", share: 21.0, change: 14 },
    { code: "R01", label: "Insufficient funds", share: 14.0, change: -3 },
    { code: "R51", label: "Exceeds withdrawal limit", share: 9.0, change: 8 },
    { code: "R54", label: "Expired card", share: 7.0, change: 1 },
  ];
}

// ====== Detection Method Mapping ======
export interface DetectionRationale {
  method: "Z-Score" | "Isolation Forest" | "Prophet" | "Moving Average";
  why: string;
  score: string;
  threshold: string;
  confidence: number;
  falsePositiveRisk: "Low" | "Medium" | "High";
  falsePositiveReason: string;
}

export function detectionRationaleFor(a: Anomaly): DetectionRationale {
  const m = a.metric.toLowerCase();
  if (m.includes("fraud")) {
    return {
      method: "Isolation Forest",
      why: "Used for multi-dimensional fraud pattern detection where events are sparse and high-dimensional (BIN × MCC × channel × geo).",
      score: `path-length anomaly = ${(0.55 + a.confidence * 0.4).toFixed(2)}`,
      threshold: "Flagged above 0.60",
      confidence: Math.round(a.confidence * 100),
      falsePositiveRisk: a.severity === "Critical" ? "Low" : "Medium",
      falsePositiveReason: "Pattern observed across multiple correlated dimensions, reducing chance of single-axis noise.",
    };
  }
  if (m.includes("volume") || m.includes("surge")) {
    return {
      method: "Prophet",
      why: "Used for time-series with weekly seasonality (e.g. weekend transaction surges). Decomposes trend + seasonality + residual.",
      score: `residual z = ${(2.1 + a.confidence * 1.5).toFixed(2)}`,
      threshold: "Flagged above residual z = 2.5",
      confidence: Math.round(a.confidence * 100),
      falsePositiveRisk: "Medium",
      falsePositiveReason: "Seasonality shift around campaign windows can occasionally trigger false positives.",
    };
  }
  if (m.includes("decline") && (m.includes("spike") || m.includes("anomaly"))) {
    return {
      method: "Moving Average",
      why: "Used for volume anomalies with trending baselines. Compares observed value to 14-day moving average ± rolling stdev.",
      score: `Δ = ${(2.4 + a.confidence).toFixed(2)} stdev`,
      threshold: "Flagged above 2.0 stdev",
      confidence: Math.round(a.confidence * 100),
      falsePositiveRisk: "Low",
      falsePositiveReason: "Baseline is stable for this MCC over the last 14 days.",
    };
  }
  // default Z-Score for approval/decline rate drops
  return {
    method: "Z-Score",
    why: "Used for metrics with stable historical baselines and normal distribution. Seasonality is low for this MCC/channel combination.",
    score: `Z = ${(3.2 + a.confidence * 1.6).toFixed(2)}`,
    threshold: "Flagged above Z = 3.0",
    confidence: Math.round(a.confidence * 100),
    falsePositiveRisk: a.confidence > 0.9 ? "Low" : "Medium",
    falsePositiveReason: "Variance has been stable; deviation exceeds 3-sigma against the 30-day baseline.",
  };
}

// ====== GenAI Grounding / Context Builder ======
export type GroundingTier = "grounded" | "partial" | "insufficient";

export interface AnomalyContext {
  anomaly_id: string;
  metric: string;
  baseline: string;
  observed: string;
  deviation: string;
  detection_method: string;
  time_window: string;
  top_contributors: Array<{ dimension: string; value: string; share: string; change?: string }>;
  top_decline_codes: Array<{ code: string; label: string; share: string; change: string }>;
  impacted_transactions: number;
  estimated_revenue_impact: string;
}

export function buildAnomalyContext(a: Anomaly): AnomalyContext {
  const rat = detectionRationaleFor(a);
  const dec = declineBreakdownFor(a.id).slice(0, 3);
  // synthesize baseline vs observed depending on metric
  let baseline = "95.6%";
  let observed = "82.4%";
  let deviation = "-13.2 percentage points";
  if (a.metric.toLowerCase().includes("fraud")) {
    baseline = "0.18%"; observed = "0.61%"; deviation = "+0.43 percentage points";
  } else if (a.metric.toLowerCase().includes("volume") || a.metric.toLowerCase().includes("surge")) {
    baseline = `${(a.affectedTxns * 0.7).toLocaleString()} txns/h`;
    observed = `${a.affectedTxns.toLocaleString()} txns/h`;
    deviation = "+42% vs baseline";
  }
  const ts = new Date(a.timestamp);
  const end = new Date(ts.getTime() + 6 * 3600_000);
  return {
    anomaly_id: a.id,
    metric: a.metric,
    baseline,
    observed,
    deviation,
    detection_method: `${rat.method} (score: ${rat.score}, threshold: ${rat.threshold})`,
    time_window: `${ts.toISOString().slice(0, 16).replace("T", " ")} to ${end.toISOString().slice(11, 16)}`,
    top_contributors: [
      { dimension: "MCC", value: a.mcc, share: "68%" },
      { dimension: "Country", value: a.country, share: "81%" },
      { dimension: "Channel", value: a.channel, share: "57%" },
    ],
    top_decline_codes: dec.map((d) => ({ code: d.code, label: d.label, share: `${d.share}%`, change: `${d.change > 0 ? "+" : ""}${d.change}%` })),
    impacted_transactions: a.affectedTxns,
    estimated_revenue_impact: `$${(a.impact / 1_000_000).toFixed(2)}M`,
  };
}

export function buildSystemPrompt(ctx: AnomalyContext): string {
  return `SYSTEM:
You are a payments risk analyst assistant for a card-issuing bank.
You answer ONLY based on the structured anomaly context provided below.
Do NOT speculate beyond the data. If the data does not support an answer, say:
"The available data does not provide enough information to answer this."
Never invent metrics, percentages, or merchant names.

ANOMALY CONTEXT:
${JSON.stringify(ctx, null, 2)}

RULES:
- Cite specific numbers from the context in every explanation
- If asked about something not in the context, refuse politely
- Format responses as: What happened → Where concentrated → Probable cause → Recommended action`;
}

export function groundingForAnomaly(a: Anomaly): GroundingTier {
  if (a.confidence >= 0.9) return "grounded";
  if (a.confidence >= 0.82) return "partial";
  return "insufficient";
}

export function classifyQueryGrounding(q: string, ctx: AnomalyContext): GroundingTier {
  const lower = q.toLowerCase();
  // questions about decline codes or contributors → grounded
  if (lower.includes("decline") || lower.includes("approval") || lower.includes("fraud") || lower.includes("impact") || lower.includes("why")) return "grounded";
  // generic forecasting or unrelated topics → insufficient
  if (lower.includes("predict") || lower.includes("forecast") || lower.includes("competitor") || lower.includes("stock")) return "insufficient";
  return ctx.anomaly_id ? "partial" : "insufficient";
}
