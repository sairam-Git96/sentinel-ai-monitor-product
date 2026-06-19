import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Pill, severityTone } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  AlertTriangle, Bot, Brain, CheckCircle2, ChevronRight, Clock, Download,
  FileText, Flame, MessageSquare, Network, Play, RefreshCw, Search, Send, ShieldAlert,
  Sparkles, Upload, UserPlus, XCircle,
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

function fmtMoney(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function fmtNum(n: number) { return n.toLocaleString(); }

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
  if (n >= 80) return "High";
  if (n >= 60) return "Medium";
  return "Low";
}

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center">{children}</span>
      </TooltipTrigger>
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

function InvestigationModule() {
  const session = typeof window !== "undefined" ? getSession() : null;
  const readOnly = session?.role === "compliance_officer";
  const canFullAccess = hasPermission(session?.role, "investigation") && !readOnly;

  const seedCases = useMemo(() => generateInvestigationCases(50), []);
  const [cases, setCases] = useState<InvestigationCase[]>(seedCases);

  // filters
  const [query, setQuery] = useState("");
  const [statusF, setStatusF] = useState<string>("all");
  const [sevF, setSevF] = useState<string>("all");
  const [countryF, setCountryF] = useState<string>("all");
  const [channelF, setChannelF] = useState<string>("all");

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
  const selected = useMemo(
    () => cases.find((c) => c.id === selectedId) ?? cases[0],
    [cases, selectedId],
  );

  // summary metrics
  const m = useMemo(() => {
    const c = cases;
    return {
      open: c.filter((x) => x.status === "Open").length,
      underInv: c.filter((x) => x.status === "Under Investigation").length,
      aiRunning: c.filter((x) => x.status === "AI Running").length,
      escalated: c.filter((x) => x.status === "Escalated").length,
      resolved: c.filter((x) => x.status === "Resolved" || x.status === "Closed").length,
      falsePos: c.filter((x) => x.status === "False Positive").length,
      highRisk: c.filter((x) => x.riskScore >= 80).length,
      avg: avgResolutionHours(c),
    };
  }, [cases]);

  // chat assistant
  const [chat, setChat] = useState<ChatMsg[]>([
    { role: "ai", text: "Hi — I'm your investigation copilot. Ask me about this case." },
  ]);
  const [chatInput, setChatInput] = useState("");
  function sendChat() {
    const q = chatInput.trim();
    if (!q) return;
    const top = selected.rootCauses[0];
    const reply =
      `For ${selected.id} (${selected.anomalyType}), AI confidence is ${selected.aiConfidence}% (${confLabel(selected.aiConfidence)}). ` +
      `Most likely root cause: ${top.cause} (${top.probability}%). ` +
      `Recommended next step: ${selected.recommendations[0]}.`;
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
      ...c,
      status: "AI Running",
      progress: 10,
      currentStep: INV_STEPS[0],
      aiConfidence: Math.min(99, c.aiConfidence + 2),
      updated: new Date().toISOString(),
      timeline: [...c.timeline, { time: new Date().toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }), label: "AI Re-analysis Started" }],
    }));
    toast.success("AI re-analysis started");
    // simulate progress
    let step = 0;
    const iv = setInterval(() => {
      step += 1;
      setCases((prev) => prev.map((c) => c.id === selected.id ? {
        ...c,
        progress: Math.min(100, c.progress + 15),
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
      ...c,
      status: falsePositive ? "False Positive" : "Closed",
      progress: 100,
      updated: new Date().toISOString(),
      timeline: [...c.timeline, { time: new Date().toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }), label: falsePositive ? "Marked False Positive" : "Case Closed" }],
    }));
    toast.success(`${selected.id} ${falsePositive ? "marked false positive" : "closed"}`);
  }

  // assign dialog
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
        <div className="mb-3 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Compliance role: read & investigate only. Status changes are disabled.
        </div>
      )}
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
        {[
          { label: "Open Cases", value: m.open, tip: "Cases awaiting triage or assignment.", icon: AlertTriangle },
          { label: "Under Investigation", value: m.underInv, tip: "Cases an analyst is actively working.", icon: Search },
          { label: "AI Running", value: m.aiRunning, tip: "Cases where AI analysis is in progress.", icon: Bot },
          { label: "Escalated", value: m.escalated, tip: "Escalated to specialised fraud/ops team.", icon: ShieldAlert },
          { label: "Resolved", value: m.resolved, tip: "Cases closed with confirmed disposition.", icon: CheckCircle2 },
          { label: "False Positives", value: m.falsePos, tip: "Flagged anomalies that were not malicious.", icon: XCircle },
          { label: "High-Risk", value: m.highRisk, tip: "Cases with risk score ≥ 80.", icon: Flame },
          { label: "Avg Resolution (h)", value: m.avg, tip: "Mean closed-case resolution time in hours.", icon: Clock },
        ].map((k) => (
          <Tip key={k.label} text={k.tip}>
            <Card className="w-full">
              <CardContent className="p-3">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span>{k.label}</span><k.icon className="size-3.5" />
                </div>
                <div className="text-xl font-semibold mt-1">{fmtNum(k.value)}</div>
              </CardContent>
            </Card>
          </Tip>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* LEFT: case list + filters */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Filters</CardTitle></CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Input placeholder="Search case, alert, type…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={statusF} onValueChange={setStatusF}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {["Open", "Under Investigation", "AI Running", "Escalated", "Resolved", "False Positive", "Closed"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sevF} onValueChange={setSevF}>
                  <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    {["Critical", "High", "Medium", "Low"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={countryF} onValueChange={setCountryF}>
                  <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {COUNTRIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={channelF} onValueChange={setChannelF}>
                  <SelectTrigger><SelectValue placeholder="Channel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    {CHANNELS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-[11px] text-muted-foreground pt-1">{filtered.length} of {cases.length} cases</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Case Queue</CardTitle>
              <Tip text="All open and historical investigation cases."><span className="text-[10px] text-muted-foreground">{filtered.length}</span></Tip>
            </CardHeader>
            <CardContent className="pt-0 max-h-[560px] overflow-y-auto space-y-1">
              {filtered.map((c) => {
                const active = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={
                      "w-full text-left rounded-md border px-2.5 py-2 transition-colors " +
                      (active ? "border-accent bg-accent/10" : "border-border hover:bg-muted/50")
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-medium truncate">{c.id} · {c.anomalyType}</div>
                      <Pill tone={severityTone(c.severity)}>{c.severity}</Pill>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate">{c.assignedTo}</span>
                      <Pill tone={statusTone(c.status)}>{c.status}</Pill>
                    </div>
                    <div className="mt-1.5"><Progress value={c.progress} className="h-1" /></div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-xs text-muted-foreground py-6 text-center">No cases match filters.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CENTER: case details */}
        <div className="col-span-12 lg:col-span-6 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{selected.id} — {selected.anomalyType}</CardTitle>
                    <Pill tone={severityTone(selected.severity)}>{selected.severity}</Pill>
                    <Pill tone={statusTone(selected.status)}>{selected.status}</Pill>
                    <Pill tone={slaTone(selected.sla)}>SLA: {selected.sla}</Pill>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Alert {selected.alertId} · Assigned to {selected.assignedTo} · {selected.country} · {selected.channel} · {selected.mcc}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
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
                  <Button size="sm" onClick={() => closeCase(false)} disabled={readOnly}><CheckCircle2 className="size-3.5 mr-1.5" />Close</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <Tip text="AI's confidence in its analysis (0–100%).">
                  <div className="rounded-md border p-2">
                    <div className="text-muted-foreground text-[10px] uppercase">AI Confidence</div>
                    <div className="text-sm font-semibold">{selected.aiConfidence}% · {confLabel(selected.aiConfidence)}</div>
                  </div>
                </Tip>
                <Tip text="Composite risk indicator. ≥80 = high risk.">
                  <div className="rounded-md border p-2">
                    <div className="text-muted-foreground text-[10px] uppercase">Risk Score</div>
                    <div className="text-sm font-semibold">{selected.riskScore}</div>
                  </div>
                </Tip>
                <Tip text="Count of transactions impacted by the anomaly window.">
                  <div className="rounded-md border p-2">
                    <div className="text-muted-foreground text-[10px] uppercase">Txn Impact</div>
                    <div className="text-sm font-semibold">{fmtNum(selected.txnImpact)}</div>
                  </div>
                </Tip>
                <Tip text="Estimated monetary impact (USD).">
                  <div className="rounded-md border p-2">
                    <div className="text-muted-foreground text-[10px] uppercase">Financial Impact</div>
                    <div className="text-sm font-semibold">{fmtMoney(selected.financialImpact)}</div>
                  </div>
                </Tip>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="reasoning">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="reasoning"><Brain className="size-3.5 mr-1" />AI Reasoning</TabsTrigger>
              <TabsTrigger value="rca"><Network className="size-3.5 mr-1" />Root Cause</TabsTrigger>
              <TabsTrigger value="timeline"><Clock className="size-3.5 mr-1" />Timeline</TabsTrigger>
              <TabsTrigger value="recs"><Sparkles className="size-3.5 mr-1" />Recommendations</TabsTrigger>
              <TabsTrigger value="notes"><MessageSquare className="size-3.5 mr-1" />Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="reasoning">
              <Card><CardContent className="p-4 space-y-4 text-sm">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">What AI Found</div>
                  <ul className="list-disc pl-5 space-y-1">{selected.findings.map((f, i) => <li key={i}>{f}</li>)}</ul>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Why AI Flagged It</div>
                  <div className="flex flex-wrap gap-1.5">{selected.reasonsFlagged.map((r) => <Pill key={r} tone="info">{r}</Pill>)}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Supporting Evidence</div>
                  <ul className="list-disc pl-5 space-y-1">{selected.evidence.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="rca">
              <Card><CardContent className="p-4 space-y-3 text-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Root Cause Probability</div>
                {selected.rootCauses.map((rc) => (
                  <div key={rc.cause} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>{rc.cause}</span><span className="font-medium">{rc.probability}%</span>
                    </div>
                    <Progress value={rc.probability} className="h-2" />
                  </div>
                ))}
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="timeline">
              <Card><CardContent className="p-4">
                <ol className="relative border-l border-border pl-4 space-y-3 text-sm">
                  {selected.timeline.map((t, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-accent" />
                      <div className="text-xs text-muted-foreground">{t.time}</div>
                      <div>{t.label}</div>
                    </li>
                  ))}
                </ol>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="recs">
              <Card><CardContent className="p-4 space-y-2 text-sm">
                {selected.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 rounded-md border p-2">
                    <div className="flex items-start gap-2"><ChevronRight className="size-4 text-accent mt-0.5" /><span>{r}</span></div>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => toast.success("Recommendation accepted")} disabled={readOnly}>Accept</Button>
                      <Button size="sm" variant="ghost" onClick={() => toast.message("Recommendation dismissed")} disabled={readOnly}>Dismiss</Button>
                    </div>
                  </div>
                ))}
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card><CardContent className="p-4 space-y-3">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selected.notes.map((n, i) => (
                    <div key={i} className="rounded-md border p-2 text-sm">
                      <div className="text-[11px] text-muted-foreground">{n.author} · {n.at}</div>
                      <div>{n.text}</div>
                    </div>
                  ))}
                </div>
                <Textarea placeholder="Add investigation note, @mention, decision…" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
                <div className="flex items-center justify-between">
                  <Button size="sm" variant="outline" onClick={() => toast.message("Attach evidence (mock)")} disabled={readOnly}><Upload className="size-3.5 mr-1.5" />Attach</Button>
                  <Button size="sm" onClick={addNote} disabled={readOnly}><Send className="size-3.5 mr-1.5" />Add Note</Button>
                </div>
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT: AI workspace + chat */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Bot className="size-4 text-accent" />AI Investigation Progress</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{selected.progress}%</span>
                </div>
                <Progress value={selected.progress} className="h-2" />
                <div className="text-[11px] text-muted-foreground mt-1">Current step: {selected.currentStep}</div>
              </div>
              <ul className="space-y-1 text-xs">
                {INV_STEPS.map((s, i) => {
                  const done = i < INV_STEPS.indexOf(selected.currentStep);
                  const current = s === selected.currentStep && selected.progress < 100;
                  return (
                    <li key={s} className="flex items-center gap-2">
                      {done ? <CheckCircle2 className="size-3.5 text-success" />
                        : current ? <Play className="size-3.5 text-accent" />
                        : <span className="size-3.5 rounded-sm border border-border" />}
                      <span className={done ? "" : current ? "font-medium" : "text-muted-foreground"}>{s}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="text-[11px] text-muted-foreground">Confidence: {confLabel(selected.aiConfidence)} ({selected.aiConfidence}%)</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="size-4 text-accent" />AI Chat Assistant</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="h-56 overflow-y-auto rounded-md border bg-muted/30 p-2 space-y-2 text-xs">
                {chat.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "text-right" : ""}>
                    <div className={"inline-block rounded-md px-2 py-1 " + (m.role === "user" ? "bg-accent/15" : "bg-background border")}>{m.text}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Input placeholder="Ask about this case…" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }} />
                <Button size="sm" onClick={sendChat}><Send className="size-3.5" /></Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Why was this flagged?", "Summarize findings", "Suggest next actions"].map((q) => (
                  <button key={q} className="text-[10px] rounded-full border px-2 py-0.5 hover:bg-muted" onClick={() => { setChatInput(q); }}>{q}</button>
                ))}
              </div>
            </CardContent>
          </Card>

          {canFullAccess && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
              <CardContent className="pt-0 grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => toast.success("Monitoring increased for 24h")}>Monitor 24h</Button>
                <Button size="sm" variant="outline" onClick={() => toast.success("Gateway provider notified")}>Notify Gateway</Button>
                <Button size="sm" variant="outline" onClick={() => toast.success("Merchants blocked (mock)")}>Block Merchants</Button>
                <Button size="sm" variant="outline" onClick={() => toast.success("Threshold tightened")}>Tighten Rules</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
