import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Download, RefreshCw, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { AppShell, Pill, severityTone } from "@/components/app-shell";
import { InfoTooltip } from "@/components/info-tooltip";
import { downloadCSV } from "@/lib/export";
import { toast } from "sonner";
import {
  generateTrend, generateAnomalies, aggregateByCountry, aggregateByMCC,
  aggregateByChannel, AI_INSIGHTS, topDeclineReasons,
} from "@/lib/mock-data";
import { getRoleDef, getSession, type Role } from "@/lib/session";
import type { TooltipKey } from "@/lib/tooltips";
import { RangeFilter, type RangeDays } from "@/components/range-filter";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Sentinel AI" }] }),
  component: Dashboard,
});

const fmtNum = (n: number) => n.toLocaleString();
const fmtMoney = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;

function KpiCard({
  label, value, delta, positive, hint, tipKey,
}: { label: string; value: string; delta: string; positive: boolean; hint?: string; tipKey?: TooltipKey }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          {tipKey && <InfoTooltip tip={tipKey} />}
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${positive ? "text-success" : "text-destructive"}`}>
          {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}{delta}
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

const ROLE_TITLES: Record<Role, { title: string; subtitle: string; variant: "risk" | "ops" | "admin" | "audit" | "fraud" }> = {
  super_admin:        { title: "Admin Dashboard",          subtitle: "System health, user activity, AI pipeline status, and security monitoring.",     variant: "admin" },
  risk_analyst:       { title: "Risk Analyst Dashboard",   subtitle: "Transaction monitoring, fraud signals, anomaly alerts, and root cause insights.", variant: "risk" },
  fraud_investigator: { title: "Fraud Investigator Dashboard", subtitle: "Fraud trends, attack vectors, case load, and incident triage.",               variant: "fraud" },
  ops_manager:        { title: "Operations Dashboard",     subtitle: "Transaction volumes, approval trends, decline drivers, and processing health.", variant: "ops" },
  compliance_officer: { title: "Compliance Dashboard",     subtitle: "Audit trail, case dispositions, and regulatory tracking.",                       variant: "audit" },
  executive:          { title: "Operational Dashboard",    subtitle: "Portfolio-level operational KPIs and AI-detected anomalies.",                    variant: "risk" },
};

function Dashboard() {
  const [role, setRole] = useState<Role>("risk_analyst");
  useEffect(() => {
    const s = getSession();
    if (s) setRole(s.role);
  }, []);
  const meta = ROLE_TITLES[role] ?? ROLE_TITLES.risk_analyst;

  const [range, setRange] = useState<RangeDays>(60);
  const trendFull = useMemo(() => generateTrend(90), []);
  const anomaliesFull = useMemo(() => generateAnomalies(40), []);
  const trend = useMemo(() => trendFull.slice(-range), [trendFull, range]);
  const cutoff = useMemo(() => Date.now() - range * 86400000, [range]);
  const anomalies = useMemo(
    () => anomaliesFull.filter((a) => new Date(a.timestamp).getTime() >= cutoff),
    [anomaliesFull, cutoff],
  );
  const byCountry = useMemo(() => aggregateByCountry(trend), [trend]);
  const byMcc = useMemo(() => aggregateByMCC(), []);
  const byChannel = useMemo(() => aggregateByChannel(), []);

  const last = trend[trend.length - 1];
  const prev = trend[Math.max(0, trend.length - 8)];
  const totalTxn = trend.reduce((s, t) => s + t.volume, 0);
  const totalRev = trend.reduce((s, t) => s + t.revenue, 0);

  const openAlerts = anomalies.filter((a) => a.status === "Open" || a.status === "Investigating").length;
  const resolved = anomalies.filter((a) => a.status === "Resolved" || a.status === "Closed").length;

  const [loading, setLoading] = useState(false);
  function refresh() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Dashboard data refreshed");
    }, 700);
  }
  function exportAll() {
    downloadCSV(trend, `dashboard-trend-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success("Exported trend data as CSV");
  }

  return (
    <AppShell
      title={`${meta.title} — ${getRoleDef(role).label}`}
      subtitle={meta.subtitle}
      actions={
        <>
          <RangeFilter value={range} onChange={setRange} />
          <button onClick={refresh} disabled={loading} className="h-9 px-3 rounded-md border bg-card hover:bg-muted text-xs inline-flex items-center gap-1.5 disabled:opacity-60">
            <RefreshCw className={"size-3.5 " + (loading ? "animate-spin" : "")} /> Refresh
          </button>
          <button onClick={exportAll} className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs inline-flex items-center gap-1.5 hover:opacity-90">
            <Download className="size-3.5" /> Export CSV
          </button>
        </>
      }
    >
      {/* Role-specific tile bar */}
      {meta.variant === "admin" && (
        <div className="mb-4 grid grid-cols-2 lg:grid-cols-6 gap-3">
          {[
            { l: "System Health", v: "99.98%" },
            { l: "Active Users", v: "184" },
            { l: "Pipeline Lag", v: "1.4s" },
            { l: "AI Jobs Running", v: "12" },
            { l: "Security Alerts", v: "2" },
            { l: "Audit Events (24h)", v: "8,412" },
          ].map((x) => (
            <div key={x.l} className="rounded-lg border bg-card p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{x.l}</div>
              <div className="mt-1 text-lg font-semibold tabular">{x.v}</div>
            </div>
          ))}
        </div>
      )}
      {meta.variant === "audit" && (
        <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { l: "Audit Events (24h)", v: "8,412" },
            { l: "Cases Reviewed", v: "47" },
            { l: "Policy Breaches", v: "3" },
            { l: "Pending Approvals", v: "12" },
          ].map((x) => (
            <div key={x.l} className="rounded-lg border bg-card p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{x.l}</div>
              <div className="mt-1 text-lg font-semibold tabular">{x.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard tipKey="total_transactions" label="Total Transactions" value={fmtNum(totalTxn)} delta="+4.2%" positive hint={`Last ${range} days`} />
        <KpiCard tipKey="approval_rate"      label="Approval Rate" value={`${last.approval}%`} delta={`${(last.approval - prev.approval).toFixed(2)}%`} positive={last.approval >= prev.approval} hint="vs 7d ago" />
        <KpiCard tipKey="decline_rate"       label="Decline Rate" value={`${last.decline}%`} delta={`${(prev.decline - last.decline).toFixed(2)}%`} positive={last.decline <= prev.decline} hint="vs 7d ago" />
        <KpiCard tipKey="fraud_rate"         label="Fraud Rate" value={`${(last.fraud * 100).toFixed(2)}%`} delta="+0.05%" positive={false} hint="3-sigma alert" />
        <KpiCard tipKey="revenue_impact"     label="Revenue Impact" value={fmtMoney(totalRev)} delta="+2.1%" positive hint="Authorized volume" />
        <KpiCard tipKey="active_alerts"      label="Active Alerts" value={String(openAlerts)} delta={`${anomalies.filter(a=>a.severity==="Critical").length} critical`} positive={false} />
        <KpiCard tipKey="open_investigations" label="Open Investigations" value="8" delta="2 escalated" positive={false} />
        <KpiCard tipKey="resolved_cases"     label="Resolved Cases" value={String(resolved + 12)} delta="+6 this week" positive hint="Last 30 days" />
      </div>

      {/* Charts row 1 */}
      <div className="mt-4 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div>
                <div className="text-sm font-semibold flex items-center gap-1.5">
                  Approval & Decline Rate Trend
                  <InfoTooltip tip="approval_rate" />
                </div>
                <div className="text-xs text-muted-foreground">Daily rolling rates · {range}d</div>
              </div>
            </div>
            <Pill tone="info">Live</Pill>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gd" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" domain={[60, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="approval" stroke="#22C55E" fill="url(#ga)" strokeWidth={2} />
                <Area type="monotone" dataKey="decline" stroke="#EF4444" fill="url(#gd)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold flex items-center gap-1.5">
                Fraud Rate Trend
                <InfoTooltip tip="fraud_rate" />
              </div>
              <div className="text-xs text-muted-foreground">3-sigma threshold</div>
            </div>
            <Pill tone="danger">Alert</Pill>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="fraud" stroke="#EF4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="mt-4 grid lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm font-semibold mb-2">Volume by Country</div>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={byCountry}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="volume" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm font-semibold mb-2">Fraud Rate by MCC</div>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={byMcc}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="mcc" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="fraud" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm font-semibold mb-2">Approval by Channel</div>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={byChannel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="channel" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[70, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="approval" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Heatmap + AI Insights */}
      <div className="mt-4 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Country × MCC Risk Heatmap</div>
            <div className="text-xs text-muted-foreground">Risk score 0–100</div>
          </div>
          <Heatmap byCountry={byCountry} byMcc={byMcc} />
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-7 rounded-md bg-accent/10 text-accent grid place-items-center"><Sparkles className="size-3.5" /></div>
            <div className="text-sm font-semibold">AI Insights</div>
            <Pill tone="info">GenAI</Pill>
          </div>
          <ul className="space-y-3">
            {AI_INSIGHTS.map((t, i) => (
              <li key={i} className="text-xs leading-relaxed flex gap-2">
                <span className="mt-1 size-1.5 rounded-full bg-accent shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <Link to="/app/assistant" className="mt-4 inline-flex text-xs font-medium text-accent hover:underline">Open AI Assistant →</Link>
        </div>
      </div>

      {/* Top decline reasons */}
      <div className="mt-4 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold flex items-center gap-1.5">
              Top Decline Reason Codes
              <InfoTooltip tip="decline_rate" />
            </div>
            <div className="text-xs text-muted-foreground">Last 24 hours · share of all declines</div>
          </div>
          <Pill tone="danger">R91 elevated</Pill>
        </div>
        <div className="grid md:grid-cols-5 gap-3">
          {topDeclineReasons().map((d) => (
            <div key={d.code} className="rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold">{d.code}</span>
                <span className={d.change > 0 ? "text-[10px] font-medium text-destructive" : "text-[10px] font-medium text-success"}>
                  {d.change > 0 ? "+" : ""}{d.change}%
                </span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground truncate" title={d.label}>{d.label}</div>
              <div className="mt-2 text-xl font-semibold tabular">{d.share}%</div>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={"h-full " + (d.code === "R91" ? "bg-destructive" : "bg-accent")} style={{ width: `${Math.min(100, d.share * 2)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest anomalies */}
      <div className="mt-4 rounded-xl border bg-card">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="text-sm font-semibold">Latest Anomalies</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { downloadCSV(anomalies, "anomalies.csv"); toast.success("Exported anomalies"); }}
              className="h-8 px-2.5 rounded-md border bg-background hover:bg-muted text-xs inline-flex items-center gap-1.5"
            >
              <Download className="size-3.5" /> CSV
            </button>
            <Link to="/app/anomalies" className="text-xs font-medium text-accent hover:underline">View all →</Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">ID</th>
                <th className="text-left font-medium px-4 py-2.5">Metric</th>
                <th className="text-left font-medium px-4 py-2.5">
                  <span className="inline-flex items-center gap-1">Severity <InfoTooltip tip="severity" /></span>
                </th>
                <th className="text-left font-medium px-4 py-2.5">Country</th>
                <th className="text-left font-medium px-4 py-2.5">MCC</th>
                <th className="text-left font-medium px-4 py-2.5">Channel</th>
                <th className="text-left font-medium px-4 py-2.5">Impact</th>
                <th className="text-left font-medium px-4 py-2.5">
                  <span className="inline-flex items-center gap-1">Status <InfoTooltip tip="status" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {anomalies.slice(0, 8).map((a) => (
                <tr key={a.id} className="border-t hover:bg-muted/40">
                  <td className="px-4 py-2.5 font-mono text-xs">{a.id}</td>
                  <td className="px-4 py-2.5">{a.metric}</td>
                  <td className="px-4 py-2.5"><Pill tone={severityTone(a.severity)}>{a.severity}</Pill></td>
                  <td className="px-4 py-2.5">{a.country}</td>
                  <td className="px-4 py-2.5">{a.mcc}</td>
                  <td className="px-4 py-2.5">{a.channel}</td>
                  <td className="px-4 py-2.5 tabular">{fmtMoney(a.impact)}</td>
                  <td className="px-4 py-2.5"><Pill tone={severityTone(a.status)}>{a.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function Heatmap({ byCountry, byMcc }: { byCountry: ReturnType<typeof aggregateByCountry>; byMcc: ReturnType<typeof aggregateByMCC> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left font-medium p-2 text-muted-foreground"></th>
            {byMcc.map((m) => <th key={m.mcc} className="text-left font-medium p-2 text-muted-foreground">{m.mcc}</th>)}
          </tr>
        </thead>
        <tbody>
          {byCountry.map((c, ci) => (
            <tr key={c.country}>
              <td className="p-2 font-medium">{c.country}</td>
              {byMcc.map((m, mi) => {
                const v = ((c.risk * 1.3 + m.risk + ci * 7 + mi * 5) % 100);
                const intensity = Math.min(1, v / 100);
                const bg = `rgba(239,68,68,${0.08 + intensity * 0.55})`;
                return (
                  <td key={m.mcc} className="p-1.5">
                    <div className="rounded-md p-2 text-[11px] font-medium tabular" style={{ background: bg }}>
                      {Math.round(v)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
