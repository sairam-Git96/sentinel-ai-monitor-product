// Central registry of structured tooltips used across modules.
// Each entry follows the documentation standard: Definition, Purpose,
// Usage, Formula (optional), Example, Impact, Recommended Action.

export type TooltipSpec = {
  title: string;
  definition: string;
  purpose: string;
  usage?: string;
  formula?: string;
  example?: string;
  impact?: string;
  action?: string;
};

export const TOOLTIPS = {
  approval_rate: {
    title: "Approval Rate",
    definition: "Percentage of transactions that were successfully approved by the issuer.",
    purpose: "Measures issuer authorization performance and end-customer experience.",
    usage: "Compare against the 7-day rolling baseline; sustained drops below baseline warrant investigation.",
    formula: "(Approved Transactions ÷ Total Transactions) × 100",
    example: "950 Approved ÷ 1,000 Total = 95.0%",
    impact: "A lower approval rate can indicate issuer outages, overly restrictive fraud rules, or merchant routing issues.",
    action: "Review top decline reasons, check issuer gateway health, and validate active risk rules.",
  },
  decline_rate: {
    title: "Decline Rate",
    definition: "Percentage of transactions that were declined.",
    purpose: "Tracks transaction rejection trends and surfaces friction in the authorization flow.",
    formula: "(Declined Transactions ÷ Total Transactions) × 100",
    example: "50 Declines ÷ 1,000 Total = 5.0%",
    impact: "Elevated decline rates erode customer experience and reduce authorized revenue.",
    action: "Analyze top decline reason codes (R91, R05, R51) and engage issuer ops where needed.",
  },
  fraud_rate: {
    title: "Fraud Rate",
    definition: "Percentage of transactions identified as fraudulent.",
    purpose: "Quantifies portfolio fraud exposure and the effectiveness of fraud controls.",
    formula: "(Fraud Transactions ÷ Total Transactions) × 100",
    example: "10 Fraud ÷ 1,000 Total = 1.0%",
    impact: "Higher fraud rate increases chargebacks, reserves, and direct financial losses.",
    action: "Investigate flagged anomalies, tighten velocity rules, and review BIN-level patterns.",
  },
  total_transactions: {
    title: "Total Transactions",
    definition: "Total number of authorization attempts in the selected period.",
    purpose: "Baseline volume metric; all rate metrics are computed against this value.",
    usage: "Watch for sudden surges or drops vs. the prior period — both can indicate issues.",
    example: "650,000 transactions over the last 24 hours.",
    impact: "Volume anomalies often correlate with campaigns, outages, or fraud attacks.",
    action: "Cross-check volume swings against marketing events and operational incidents.",
  },
  revenue_impact: {
    title: "Revenue Impact",
    definition: "Estimated authorized revenue exposed to risk based on transaction value.",
    purpose: "Translates technical anomalies into monetary impact for business stakeholders.",
    formula: "Σ(Authorized Amount) for the affected segment",
    example: "$2.1M of authorized volume impacted by the USA Travel approval drop.",
    impact: "Directly tied to monthly authorized revenue and merchant satisfaction.",
    action: "Prioritize incident response based on highest revenue-at-risk segments.",
  },
  active_alerts: {
    title: "Active Alerts",
    definition: "Count of anomalies currently open or under investigation.",
    purpose: "Operational queue indicator for the risk and fraud teams.",
    usage: "A growing queue suggests under-staffing or systemic issues; aim to keep critical alerts < 5.",
    impact: "Backlogged critical alerts increase mean-time-to-detect and mean-time-to-respond.",
    action: "Triage critical alerts first; assign owners and escalate if unattended > 30 min.",
  },
  open_investigations: {
    title: "Open Investigations",
    definition: "Active investigation cases not yet resolved or closed.",
    purpose: "Tracks analyst workload and case throughput.",
    example: "8 open cases, 2 escalated to Tier-2.",
    impact: "High open counts may delay regulatory reporting and incident closure.",
    action: "Reassign aging cases and review SLA adherence in the Case Management module.",
  },
  resolved_cases: {
    title: "Resolved Cases",
    definition: "Investigation cases closed with documented resolution.",
    purpose: "Measures team throughput and operational effectiveness over time.",
    example: "32 resolved in the last 30 days, +6 this week.",
    action: "Compare to inflow rate; resolution should trend at or above new case rate.",
  },
  z_score: {
    title: "Z-Score Detection",
    definition: "Standard deviations from a stable historical baseline.",
    purpose: "Flags statistically significant deviations in metrics with stable distributions.",
    formula: "Z = (observed − mean) ÷ standard_deviation",
    example: "Z = 4.2 means the observed value is 4.2σ above normal — extremely unusual.",
    impact: "Z > 3.0 typically indicates a real anomaly worth investigating.",
    action: "Review contributing dimensions (MCC, country, channel) for concentration.",
  },
  confidence: {
    title: "Confidence",
    definition: "Model's confidence that the flagged event is a true anomaly (0–100%).",
    purpose: "Helps analysts prioritize which anomalies to investigate first.",
    usage: "≥ 90% = high confidence; 70–89% = review; < 70% = monitor.",
    impact: "Low confidence findings often need additional context before action.",
    action: "Start with the highest-confidence critical anomalies of the day.",
  },
  severity: {
    title: "Severity",
    definition: "Business severity level assigned to an anomaly or case.",
    purpose: "Drives prioritization, routing, and SLA targets.",
    usage: "Critical → P1 (≤ 15 min response). High → P2 (≤ 1 hr). Medium → P3 (same day). Low → P4 (weekly review).",
    impact: "Mis-classification leads to either alert fatigue or missed material issues.",
    action: "Re-grade severity if the financial impact or scope changes during investigation.",
  },
  status: {
    title: "Status",
    definition: "Lifecycle state of an anomaly or investigation case.",
    purpose: "Tracks where the item sits in the response workflow.",
    usage: "Open → Investigating → Escalated → Resolved → Closed.",
    action: "Move stale items forward; escalate if Investigating > 4 hours without progress.",
  },
} as const satisfies Record<string, TooltipSpec>;

export type TooltipKey = keyof typeof TOOLTIPS;
