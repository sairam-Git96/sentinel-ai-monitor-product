import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Pill, severityTone } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  AlertTriangle, Bot, CheckCircle2, ChevronRight, Clock, Download, FileText,
  Flame, MessageSquare, Network, Play, RefreshCw, Search, Send, ShieldAlert,
  Sparkles, Upload, UserPlus, XCircle, X, Filter, ArrowUpRight,
} from "lucide-react";
import {
  INV_STEPS, avgResolutionHours, generateInvestigationCases,
  type InvestigationCase, type InvCaseStatus,
} from "@/lib/investigation-mock";
import { getSession, hasPermission } from "@/lib/session";

export const Route = createFileRoute("/app/investigation")({
  head: () => ({ meta: [{ title: "Investigation Module · Sentinel AI" }] }),
  component: InvestigationModule,
});

type ChatMsg = { role: "user" | "ai"; text: string };

const fmtMoney = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtNum = (n: number) => n.toLocaleString();

function statusTone(s: InvCaseStatus) {
  if (s === "Resolved" || s === "Closed") return "success" as const;
  if (s === "Escalated") return "danger" as const;
  if (s === "AI Running" || s === "Under Investigation") return "info" as const;
  if (s === "False Positive") return "neutral" as const;
  return "warning" as const;
}
function slaTone(s: string) {
  if (s === "On Track") return "success" as const;
  if (s === "At Risk") return "warning" as const;
  return "danger" as const;
}
function confLabel(n: number) {
  return n >= 80 ? "High" : n >= 60 ? "Medium" : "Low";
}

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild><span className="inline-flex items-center">{children}</span></TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

function csvDownload(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Section header used across the workspace ---------- */
function Section({
  icon: Icon, title, hint, right, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="size-4 text-accent shrink-0" />
          <h3 className="text-sm font-semibold tracking-tight truncate">{title}</h3>
          {hint && <span className="text-[11px] text-muted-foreground truncate hidden md:inline">· {hint}</span>}
        </div>
        {right}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function InvestigationModule() {
  const session = typeof window !== "undefined" ? getSession() : null;
  const readOnly = session?.role === "compliance_officer";
  const canFullAccess = hasPermission(session?.role, "investigation") && !readOnly;

  const seedCases = useMemo(() => generateInvestigationCases(50), []);
  const [cases, setCases] = useState<InvestigationCase[]>(seedCases);

  // filters
  const [query, setQuery] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [sevF, setSevF] = useState("all");
  const [countryF, setCountryF] = useState("all");
  const [channelF, setChannelF] = useState("all");
  const activeFilters = [statusF, sevF, countryF, channelF].filter((v) => v !== "all").length;

  function resetFilters() {
    setStatusF("all"); setSevF("all"); setCountryF("all"); setChannelF("all"); setQuery("");
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return cases.filter((c) =>
      (!q || c.id.toLowerCase().includes(q) || c.alertId.toLowerCase().includes(q) || c.anomalyType.toLowerCase().includes(q) || c.assignedTo.toLowerCase().includes(q)) &&
      (statusF === "all" || c.status === statusF) &&
      (sevF === "all" || c.severity === sevF) &&
      (countryF === "all" || c.country === countryF) &&
      (channelF === "all" || c.channel === channelF),
    );
  }, [cases, query, statusF, sevF, countryF, channelF]);

  const [selectedId, setSelectedId] = useState<string>(seedCases[0].id);
  const selected = useMemo(() => cases.find((c) => c.id === selectedId) ?? cases[0], [cases, selectedId]);

  // summary metrics
  const m = useMemo(() => ({
    open: cases.filter((x) => x.status === "Open").length,
    underInv: cases.filter((x) => x.status === "Under Investigation").length,
    aiRunning: cases.filter((x) => x.status === "AI Running").length,
    escalated: cases.filter((x) => x.status === "Escalated").length,
    resolved: cases.filter((x) => x.status === "Resolved" || x.status === "Closed").length,
    falsePos: cases.filter((x) => x.status === "False Positive").length,
    highRisk: cases.filter((x) => x.riskScore >= 80).length,
    avg: avgResolutionHours(cases),
  }), [cases]);

  // chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([
    { role: "ai", text: "Hi — I'm your investigation copilot. Ask me anything about this case." },
  ]);
  const [chatInput, setChatInput] = useState("");
  function sendChat(text?: string) {
    const q = (text ?? chatInput).trim();
    if (!q) return;
    const top = selected.rootCauses[0];
    const reply =
      `For ${selected.id} (${selected.anomalyType}): AI confidence ${selected.aiConfidence}% (${confLabel(selected.aiConfidence)}). ` +
      `Most likely root cause: ${top.cause} (${top.probability}%). Recommended next step: ${selected.recommendations[0]}.`;
    setChat((c) => [...c, { role: "user", text: q }, { role: "ai", text: reply }]);
    setChatInput("");
  }

  // notes
  const [noteDraft, setNoteDraft] = useState("");
  function addNote() {
    if (!noteDraft.trim()) { toast.error("Note is empty"); return; }
    if (readOnly) { toast.error("Read-only role"); return; }
    setCases((prev) => prev.map((c) => c.id === selected.id ? {
      ...c,
      notes: [...c.notes, { author: session?.email ?? "Analyst", at: new Date().toLocaleString(), text: noteDraft.trim() }],
      updated: new Date().toISOString(),
    } : c));
    setNoteDraft("");
    toast.success("Note added");
  }

  function mutate(id: string, fn: (c: InvestigationCase) => InvestigationCase) {
    setCases((prev) => prev.map((c) => c.id === id ? fn(c) : c));
  }

  function escalate() {
    if (readOnly) return toast.error("Read-only role");
    mutate(selected.id, (c) => ({ ...c, status: "Escalated", updated: new Date().toISOString() }));
    toast.success(`${selected.id} escalated to Fraud Team`);
  }
  function rerunAI() {
    mutate(selected.id, (c) => ({
      ...c, status: "AI Running", progress: 10, currentStep: INV_STEPS[0],
      aiConfidence: Math.min(99, c.aiConfidence + 2),
      updated: new Date().toISOString(),
      timeline: [...c.timeline, { time: new Date().toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }), label: "AI Re-analysis Started" }],
    }));
    toast.success("AI re-analysis started");
    let step = 0;
    const iv = setInterval(() => {
      step += 1;
      setCases((prev) => prev.map((c) => c.id === selected.id ? {
        ...c, progress: Math.min(100, c.progress + 15),
        currentStep: INV_STEPS[Math.min(INV_STEPS.length - 1, step)],
      } : c));
      if (step >= INV_STEPS.length - 1) {
        clearInterval(iv);
        mutate(selected.id, (c) => ({ ...c, status: "Under Investigation", progress: 100 }));
      }
    }, 700);
  }
  function closeCase(falsePositive = false) {
    if (readOnly) return toast.error("Read-only role");
    mutate(selected.id, (c) => ({
      ...c, status: falsePositive ? "False Positive" : "Closed", progress: 100,
      updated: new Date().toISOString(),
      timeline: [...c.timeline, { time: new Date().toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }), label: falsePositive ? "Marked False Positive" : "Case Closed" }],
    }));
    toast.success(`${selected.id} ${falsePositive ? "marked false positive" : "closed"}`);
  }

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignee, setAssignee] = useState("");
  function applyAssign() {
    if (!assignee.trim()) return;
    mutate(selected.id, (c) => ({ ...c, assignedTo: assignee.trim(), updated: new Date().toISOString() }));
    setAssignee(""); setAssignOpen(false);
    toast.success(`Assigned to ${assignee}`);
  }

  function exportQueue() {
    csvDownload("investigation-queue.csv", [
      ["Case ID", "Alert ID", "Anomaly Type", "Severity", "Status", "Assigned To", "AI Confidence", "Risk", "Txn Impact", "Financial Impact", "Created", "Updated", "SLA"],
      ...filtered.map((c) => [c.id, c.alertId, c.anomalyType, c.severity, c.status, c.assignedTo, c.aiConfidence, c.riskScore, c.txnImpact, c.financialImpact, c.created, c.updated, c.sla]),
    ]);
    toast.success("Queue exported");
  }
  function exportReport() {
    const c = selected;
    csvDownload(`${c.id}-report.csv`, [
      ["Field", "Value"],
      ["Case ID", c.id], ["Alert", c.alertId], ["Type", c.anomalyType], ["Severity", c.severity],
      ["Status", c.status], ["Assigned", c.assignedTo], ["AI Confidence", c.aiConfidence],
      ["Risk Score", c.riskScore], ["Txn Impact", c.txnImpact], ["Financial Impact", c.financialImpact],
      ["Country", c.country], ["MCC", c.mcc], ["Channel", c.channel], ["Progress", c.progress],
      ["Current Step", c.currentStep], ["Created", c.created], ["Updated", c.updated], ["SLA", c.sla],
      ["Top Root Cause", `${c.rootCauses[0].cause} (${c.rootCauses[0].probability}%)`],
    ]);
    toast.success("Investigation report exported");
  }

  const COUNTRIES = useMemo(() => Array.from(new Set(seedCases.map((c) => c.country))).sort(), [seedCases]);
  const CHANNELS = useMemo(() => Array.from(new Set(seedCases.map((c) => c.channel))).sort(), [seedCases]);

  const summary = [
    { label: "Open", value: m.open, tip: "Cases awaiting triage or assignment.", icon: AlertTriangle, tone: "warning" },
    { label: "Investigating", value: m.underInv, tip: "Cases an analyst is actively working.", icon: Search, tone: "info" },
    { label: "AI Running", value: m.aiRunning, tip: "Cases where AI analysis is in progress.", icon: Bot, tone: "info" },
    { label: "Escalated", value: m.escalated, tip: "Escalated to specialised fraud/ops team.", icon: ShieldAlert, tone: "danger" },
    { label: "Resolved", value: m.resolved, tip: "Cases closed with confirmed disposition.", icon: CheckCircle2, tone: "success" },
    { label: "False Positive", value: m.falsePos, tip: "Flagged anomalies that were not malicious.", icon: XCircle, tone: "neutral" },
    { label: "High-Risk", value: m.highRisk, tip: "Cases with risk score ≥ 80.", icon: Flame, tone: "danger" },
    { label: "Avg Resolution", value: `${m.avg}h`, tip: "Mean closed-case resolution time in hours.", icon: Clock, tone: "neutral" },
  ] as const;

  return (
    <AppShell
      title="Investigation Module"
      subtitle="AI-assisted anomaly investigation, root-cause analysis, and case workspace"
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportQueue}><Download className="size-3.5 mr-1.5" />Export Queue</Button>
          <Button size="sm" onClick={rerunAI}><RefreshCw className="size-3.5 mr-1.5" />Re-run AI</Button>
        </div>
      }
    >
      {readOnly && (
        <div className="mb-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Compliance role: read & investigate only. Status changes are disabled.
        </div>
      )}

      {/* Summary strip — single row of compact KPI tiles */}
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {summary.map((k) => (
          <Tip key={k.label} text={k.tip}>
            <Card className="w-full hover:border-accent/40 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span className="truncate">{k.label}</span>
                  <k.icon className="size-3.5 shrink-0" />
                </div>
                <div className="text-xl font-semibold mt-1 leading-none">{fmtNum(k.value as number) || k.value}</div>
              </CardContent>
            </Card>
          </Tip>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* LEFT — case queue */}
        <aside className="col-span-12 lg:col-span-3 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-lg border bg-card">
            <div className="border-b p-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search case, alert, type…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <div className="flex items-center justify-between">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <Filter className="size-3 mr-1" />Filters{activeFilters > 0 && <span className="ml-1 rounded-full bg-accent/20 text-accent px-1.5 text-[10px]">{activeFilters}</span>}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader><SheetTitle>Filter cases</SheetTitle></SheetHeader>
                    <div className="mt-4 space-y-3 px-4">
                      {[
                        { label: "Status", value: statusF, set: setStatusF, opts: ["Open", "Under Investigation", "AI Running", "Escalated", "Resolved", "False Positive", "Closed"] },
                        { label: "Severity", value: sevF, set: setSevF, opts: ["Critical", "High", "Medium", "Low"] },
                        { label: "Country", value: countryF, set: setCountryF, opts: COUNTRIES },
                        { label: "Channel", value: channelF, set: setChannelF, opts: CHANNELS },
                      ].map((f) => (
                        <div key={f.label}>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{f.label}</div>
                          <Select value={f.value} onValueChange={f.set}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All {f.label}</SelectItem>
                              {f.opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full" onClick={resetFilters}>Reset filters</Button>
                    </div>
                  </SheetContent>
                </Sheet>
                <span className="text-[11px] text-muted-foreground">{filtered.length} of {cases.length}</span>
              </div>
              {activeFilters > 0 && (
                <div className="flex flex-wrap gap-1">
                  {[
                    { v: statusF, set: setStatusF }, { v: sevF, set: setSevF },
                    { v: countryF, set: setCountryF }, { v: channelF, set: setChannelF },
                  ].filter((x) => x.v !== "all").map((x, i) => (
                    <button key={i} onClick={() => x.set("all")} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] hover:bg-muted/70">
                      {x.v}<X className="size-2.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <ul className="max-h-[calc(100vh-280px)] overflow-y-auto divide-y">
              {filtered.map((c) => {
                const active = c.id === selectedId;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className={
                        "w-full text-left px-3 py-2.5 transition-colors group " +
                        (active ? "bg-accent/10 border-l-2 border-l-accent" : "border-l-2 border-l-transparent hover:bg-muted/40")
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold truncate">{c.id}</span>
                        <Pill tone={severityTone(c.severity)}>{c.severity}</Pill>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">{c.anomalyType}</div>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground truncate">{c.assignedTo}</span>
                        <Pill tone={statusTone(c.status)}>{c.status}</Pill>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Progress value={c.progress} className="h-1 flex-1" />
                        <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{c.progress}%</span>
                      </div>
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-3 py-10 text-center text-xs text-muted-foreground">No cases match filters.</li>
              )}
            </ul>
          </div>
        </aside>

        {/* CENTER — case workspace, single scroll, sections instead of tabs */}
        <main className="col-span-12 lg:col-span-9 space-y-4">
          {/* Case header card */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground">Case · {selected.alertId}</div>
                  <h2 className="text-lg font-semibold tracking-tight mt-0.5 flex items-center gap-2 flex-wrap">
                    {selected.id}
                    <span className="text-muted-foreground font-normal">·</span>
                    <span>{selected.anomalyType}</span>
                  </h2>
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <Pill tone={severityTone(selected.severity)}>{selected.severity}</Pill>
                    <Pill tone={statusTone(selected.status)}>{selected.status}</Pill>
                    <Pill tone={slaTone(selected.sla)}>SLA · {selected.sla}</Pill>
                    <span className="text-[11px] text-muted-foreground ml-1">
                      {selected.assignedTo} · {selected.country} · {selected.channel} · {selected.mcc}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" disabled={readOnly}><UserPlus className="size-3.5 mr-1.5" />Assign</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Assign {selected.id}</DialogTitle></DialogHeader>
                      <Input placeholder="Analyst name or email" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
                        <Button onClick={applyAssign}>Assign</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="outline" onClick={escalate} disabled={readOnly}><ShieldAlert className="size-3.5 mr-1.5" />Escalate</Button>
                  <Button size="sm" variant="outline" onClick={rerunAI}><RefreshCw className="size-3.5 mr-1.5" />Re-run AI</Button>
                  <Button size="sm" variant="outline" onClick={exportReport}><FileText className="size-3.5 mr-1.5" />Report</Button>
                  <Button size="sm" variant="outline" onClick={() => closeCase(true)} disabled={readOnly}><XCircle className="size-3.5 mr-1.5" />False Positive</Button>
                  <Button size="sm" onClick={() => closeCase(false)} disabled={readOnly}><CheckCircle2 className="size-3.5 mr-1.5" />Close Case</Button>
                </div>
              </div>
            </div>
            {/* metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 border-t md:border-t-0">
              {[
                { label: "AI Confidence", value: `${selected.aiConfidence}%`, sub: confLabel(selected.aiConfidence), tip: "AI's confidence in its analysis (0–100%)." },
                { label: "Risk Score", value: `${selected.riskScore}`, sub: selected.riskScore >= 80 ? "High risk" : "Standard", tip: "Composite risk indicator. ≥80 = high risk." },
                { label: "Transactions Impacted", value: fmtNum(selected.txnImpact), sub: "in window", tip: "Count of transactions impacted by the anomaly window." },
                { label: "Financial Impact", value: fmtMoney(selected.financialImpact), sub: "estimated", tip: "Estimated monetary impact (USD)." },
              ].map((s) => (
                <Tip key={s.label} text={s.tip}>
                  <div className="px-5 py-3 w-full">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                    <div className="text-lg font-semibold leading-tight">{s.value}</div>
                    <div className="text-[11px] text-muted-foreground">{s.sub}</div>
                  </div>
                </Tip>
              ))}
            </div>
          </div>

          {/* AI investigation progress — pipeline */}
          <Section
            icon={Bot}
            title="AI Investigation Progress"
            hint={`${selected.progress}% · ${selected.currentStep}`}
            right={<span className="text-[11px] text-muted-foreground">Confidence: {confLabel(selected.aiConfidence)} ({selected.aiConfidence}%)</span>}
          >
            <div className="mb-3"><Progress value={selected.progress} className="h-1.5" /></div>
            <ol className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {INV_STEPS.map((s, i) => {
                const currentIdx = INV_STEPS.indexOf(selected.currentStep);
                const done = i < currentIdx || selected.progress === 100;
                const current = i === currentIdx && selected.progress < 100;
                return (
                  <li key={s} className={
                    "rounded-md border px-2.5 py-2 text-xs flex items-center gap-2 " +
                    (done ? "bg-success/5 border-success/20"
                      : current ? "bg-accent/10 border-accent/30"
                      : "bg-muted/30 border-border text-muted-foreground")
                  }>
                    {done ? <CheckCircle2 className="size-3.5 text-success shrink-0" />
                      : current ? <Play className="size-3.5 text-accent shrink-0" />
                      : <span className="size-3.5 rounded-sm border border-border shrink-0" />}
                    <span className="truncate">{s}</span>
                  </li>
                );
              })}
            </ol>
          </Section>

          {/* Two-column reasoning + root cause */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section icon={Sparkles} title="AI Reasoning">
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">What AI Found</div>
                  <ul className="space-y-1">
                    {selected.findings.map((f, i) => (
                      <li key={i} className="flex gap-2"><span className="text-accent">•</span><span>{f}</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Why Flagged</div>
                  <div className="flex flex-wrap gap-1.5">{selected.reasonsFlagged.map((r) => <Pill key={r} tone="info">{r}</Pill>)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Supporting Evidence</div>
                  <ul className="space-y-1">
                    {selected.evidence.map((e, i) => (
                      <li key={i} className="flex gap-2"><span className="text-accent">•</span><span>{e}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>

            <Section icon={Network} title="Root Cause Probability">
              <div className="space-y-2.5">
                {selected.rootCauses.map((rc, i) => (
                  <div key={rc.cause} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className={"size-1.5 rounded-full " + (i === 0 ? "bg-accent" : "bg-muted-foreground/40")} />
                        {rc.cause}
                      </span>
                      <span className="font-semibold tabular-nums">{rc.probability}%</span>
                    </div>
                    <Progress value={rc.probability} className="h-1.5" />
                  </div>
                ))}
                <div className="text-[11px] text-muted-foreground pt-1">
                  Top likely cause: <span className="text-foreground font-medium">{selected.rootCauses[0].cause}</span>.
                </div>
              </div>
            </Section>
          </div>

          {/* Timeline + Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Section icon={Clock} title="Investigation Timeline">
                <ol className="relative border-l border-border pl-4 space-y-3 text-sm">
                  {selected.timeline.map((t, i) => (
                    <li key={i} className="relative">
                      <span className={"absolute -left-[21px] top-1 size-2.5 rounded-full " + (i === selected.timeline.length - 1 ? "bg-accent ring-2 ring-accent/30" : "bg-muted-foreground/40")} />
                      <div className="text-[11px] text-muted-foreground">{t.time}</div>
                      <div>{t.label}</div>
                    </li>
                  ))}
                </ol>
              </Section>
            </div>
            <div className="md:col-span-3">
              <Section
                icon={ArrowUpRight}
                title="AI Recommendations"
                hint="Accept to log analyst action"
              >
                <div className="space-y-2">
                  {selected.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 rounded-md border p-2.5 text-sm hover:bg-muted/40 transition-colors">
                      <div className="flex items-start gap-2 min-w-0">
                        <ChevronRight className="size-4 text-accent mt-0.5 shrink-0" />
                        <span className="min-w-0">{r}</span>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success("Recommendation accepted")} disabled={readOnly}>Accept</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.message("Recommendation dismissed")} disabled={readOnly}>Dismiss</Button>
                      </div>
                    </div>
                  ))}
                </div>
                {canFullAccess && (
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success("Monitoring increased for 24h")}>Monitor 24h</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success("Gateway provider notified")}>Notify Gateway</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success("Merchants blocked (mock)")}>Block Merchants</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success("Threshold tightened")}>Tighten Rules</Button>
                  </div>
                )}
              </Section>
            </div>
          </div>

          {/* Notes & collaboration */}
          <Section icon={MessageSquare} title="Notes & Collaboration" hint={`${selected.notes.length} entries`}>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {selected.notes.map((n, i) => (
                <div key={i} className="rounded-md border bg-muted/20 p-2.5 text-sm">
                  <div className="text-[11px] text-muted-foreground">{n.author} · {n.at}</div>
                  <div className="mt-0.5">{n.text}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <Textarea
                rows={2}
                placeholder="Add an investigation note, @mention a teammate, record a decision…"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <Button size="sm" variant="outline" onClick={() => toast.message("Attach evidence (mock)")} disabled={readOnly}>
                  <Upload className="size-3.5 mr-1.5" />Attach evidence
                </Button>
                <Button size="sm" onClick={addNote} disabled={readOnly}>
                  <Send className="size-3.5 mr-1.5" />Post note
                </Button>
              </div>
            </div>
          </Section>
        </main>
      </div>

      {/* Floating AI copilot dock */}
      <div className="fixed bottom-4 right-4 z-40">
        {!chatOpen ? (
          <Button
            onClick={() => setChatOpen(true)}
            className="h-12 rounded-full shadow-lg shadow-accent/30 pl-3 pr-4 gap-2"
          >
            <span className="size-7 rounded-full bg-white/15 grid place-items-center"><Bot className="size-4" /></span>
            <span className="text-sm">Ask AI Copilot</span>
          </Button>
        ) : (
          <div className="w-[360px] rounded-xl border bg-card shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="size-7 rounded-full gradient-brand grid place-items-center"><Bot className="size-3.5 text-white" /></span>
                <div>
                  <div className="text-sm font-semibold leading-none">Investigation Copilot</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Context: {selected.id}</div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <div className="h-72 overflow-y-auto p-3 space-y-2 text-xs bg-muted/20">
              {chat.map((msg, i) => (
                <div key={i} className={msg.role === "user" ? "text-right" : ""}>
                  <div className={
                    "inline-block max-w-[85%] rounded-lg px-2.5 py-1.5 " +
                    (msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-background border")
                  }>{msg.text}</div>
                </div>
              ))}
            </div>
            <div className="border-t p-2 space-y-2">
              <div className="flex gap-1.5">
                <Input
                  placeholder="Ask about this case…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
                  className="h-9"
                />
                <Button size="sm" onClick={() => sendChat()} className="h-9 px-3"><Send className="size-3.5" /></Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {["Why was this flagged?", "Summarize findings", "Suggest next actions", "Compare to past cases"].map((q) => (
                  <button key={q} onClick={() => sendChat(q)} className="text-[10px] rounded-full border px-2 py-0.5 hover:bg-muted">{q}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}