import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Filter, Search, Microscope, Code2, UserCheck, Sparkles } from "lucide-react";
import { ModuleActions } from "@/components/module-actions";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";
import { AppShell, Pill, severityTone } from "@/components/app-shell";
import {
  generateAnomalies, detectionRationaleFor, declineBreakdownFor,
  buildAnomalyContext, buildSystemPrompt, type Anomaly, type Severity, type Status,
} from "@/lib/mock-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { InvestigateDialog } from "@/components/investigate-dialog";

export const Route = createFileRoute("/app/anomalies")({
  head: () => ({ meta: [{ title: "Anomaly Explorer · Sentinel AI" }] }),
  component: Anomalies,
});

const ANALYSTS = ["Sasha Patel", "Marcus Chen", "Emily Johnson", "Rodrigo Gomez", "Jamie Smith"];

const fmtMoney = (n: number) => `$${(n / 1_000_000).toFixed(2)}M`;

type AnomalyRow = Anomaly & { assignee?: string };

function Anomalies() {
  const seed = useMemo<AnomalyRow[]>(() => generateAnomalies(25), []);
  const [all, setAll] = useState<AnomalyRow[]>(seed);
  const [q, setQ] = useState("");
  const [sev, setSev] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [country, setCountry] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string | null>(seed[0]?.id ?? null);
  const [showContext, setShowContext] = useState(false);

  const filtered = all.filter((a) => {
    if (sev !== "All" && a.severity !== sev) return false;
    if (status !== "All" && a.status !== status) return false;
    if (country !== "All" && a.country !== country) return false;
    if (q && !`${a.id} ${a.metric} ${a.mcc} ${a.channel}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const selected = all.find((a) => a.id === selectedId) ?? null;
  const countries = ["All", ...Array.from(new Set(all.map((a) => a.country)))];

  function updateAnomaly(id: string, patch: Partial<AnomalyRow>) {
    setAll((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  // Dialog state
  const [escOpen, setEscOpen] = useState(false);
  const [escSev, setEscSev] = useState<Severity>("Critical");
  const [escNote, setEscNote] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTo, setAssignTo] = useState<string>(ANALYSTS[0]);
  const [assignNote, setAssignNote] = useState("");

  const [investigateOpen, setInvestigateOpen] = useState(false);

  function handleInvestigate() {
    if (!selected) return;
    if (selected.status === "Resolved" || selected.status === "Closed") {
      toast.info(`${selected.id} is ${selected.status.toLowerCase()} — reopen before investigating.`);
      return;
    }
    if (selected.status !== "Investigating") {
      updateAnomaly(selected.id, { status: "Investigating" satisfies Status });
    }
    setInvestigateOpen(true);
  }

  function openEscalate() {
    if (!selected) return;
    const next: Severity =
      selected.severity === "Low" ? "Medium" :
      selected.severity === "Medium" ? "High" : "Critical";
    setEscSev(next);
    setEscNote("");
    setEscOpen(true);
  }

  function confirmEscalate() {
    if (!selected) return;
    updateAnomaly(selected.id, { status: "Escalated" satisfies Status, severity: escSev });
    setEscOpen(false);
    toast.success(`${selected.id} escalated to ${escSev}.`, {
      description: escNote || "Routed to on-call risk lead.",
    });
  }

  function openAssign() {
    if (!selected) return;
    setAssignTo(selected.assignee ?? ANALYSTS[0]);
    setAssignNote("");
    setAssignOpen(true);
  }

  function confirmAssign() {
    if (!selected) return;
    updateAnomaly(selected.id, { assignee: assignTo });
    setAssignOpen(false);
    toast.success(`${selected.id} assigned to ${assignTo}.`, {
      description: assignNote || "Owner notified via on-call channel.",
    });
  }

  return (
    <AppShell
      title="Anomaly Explorer"
      subtitle="Investigate AI-detected anomalies across country, MCC, channel, and severity."
      actions={
        <div className="flex items-center gap-1.5">
          <button onClick={() => toast.message("Saved views", { description: "View manager coming online…" })} className="h-9 px-3 rounded-md border bg-card hover:bg-muted text-xs inline-flex items-center gap-1.5"><Filter className="size-3.5" /> Saved Views</button>
          <ModuleActions module="Anomalies" rows={filtered} />
        </div>
      }
    >
      <div className="rounded-xl border bg-card p-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, metric, MCC…" className="h-9 w-64 rounded-md border bg-background pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
        <Select label="Severity" value={sev} onChange={setSev} options={["All", "Critical", "High", "Medium", "Low"]} />
        <Select label="Status" value={status} onChange={setStatus} options={["All", "Open", "Investigating", "Escalated", "Resolved", "Closed"]} />
        <Select label="Country" value={country} onChange={setCountry} options={countries} />
        <div className="ml-auto text-xs text-muted-foreground">{filtered.length} of {all.length} anomalies</div>
      </div>

      <div className="mt-4 grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto max-h-[720px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>{["ID", "Metric", "Severity", "Country", "Status"].map((h) =>
                  <th key={h} className="text-left font-medium px-3 py-2.5">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => { setSelectedId(a.id); setShowContext(false); }}
                    className={"border-t cursor-pointer " + (selected?.id === a.id ? "bg-accent/5" : "hover:bg-muted/40")}
                  >
                    <td className="px-3 py-2.5 font-mono text-xs">{a.id}</td>
                    <td className="px-3 py-2.5">{a.metric}</td>
                    <td className="px-3 py-2.5"><Pill tone={severityTone(a.severity)}>{a.severity}</Pill></td>
                    <td className="px-3 py-2.5">{a.country}</td>
                    <td className="px-3 py-2.5"><Pill tone={severityTone(a.status)}>{a.status}</Pill></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-sm text-muted-foreground py-16">No anomalies match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {selected ? (
            <>
              <DetailPanel
                a={selected}
                onShowContext={() => setShowContext((v) => !v)}
                contextOpen={showContext}
                onInvestigate={handleInvestigate}
                onEscalate={openEscalate}
                onAssign={openAssign}
              />
              <RationalePanel a={selected} />
              <DeclineBreakdownPanel a={selected} />
              {showContext && <ContextPreview a={selected} />}
            </>
          ) : <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">Select an anomaly.</div>}
        </div>
      </div>

      {/* Escalate dialog */}
      <Dialog open={escOpen} onOpenChange={setEscOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate {selected?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              {selected?.metric} · {selected?.country} · {selected?.mcc}
            </div>
            <label className="block text-xs">
              <span className="text-muted-foreground">New severity</span>
              <select
                value={escSev}
                onChange={(e) => setEscSev(e.target.value as Severity)}
                className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs"
              >
                {(["Critical", "High", "Medium", "Low"] as Severity[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">Escalation note (optional)</span>
              <textarea
                value={escNote}
                onChange={(e) => setEscNote(e.target.value)}
                rows={3}
                placeholder="Context to share with the on-call lead…"
                className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-xs"
              />
            </label>
          </div>
          <DialogFooter>
            <button onClick={() => setEscOpen(false)} className="h-9 px-3 rounded-md border text-xs">Cancel</button>
            <button onClick={confirmEscalate} className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs">Escalate</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {selected?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-xs">
              <span className="text-muted-foreground">Owner</span>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs"
              >
                {ANALYSTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">Handoff note (optional)</span>
              <textarea
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                rows={3}
                placeholder="What should the owner look at first?"
                className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-xs"
              />
            </label>
          </div>
          <DialogFooter>
            <button onClick={() => setAssignOpen(false)} className="h-9 px-3 rounded-md border text-xs">Cancel</button>
            <button onClick={confirmAssign} className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs">Assign</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvestigateDialog
        anomaly={selected}
        open={investigateOpen}
        onOpenChange={setInvestigateOpen}
        onResolve={() => selected && updateAnomaly(selected.id, { status: "Resolved" })}
        onKeepInvestigating={() => selected && updateAnomaly(selected.id, { status: "Investigating" })}
        onEscalate={() => {
          if (!selected) return;
          updateAnomaly(selected.id, { status: "Escalated" });
          openEscalate();
        }}
      />
    </AppShell>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="text-xs flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-accent/30">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

function DetailPanel({ a, onShowContext, contextOpen, onInvestigate, onEscalate, onAssign }: {
  a: AnomalyRow;
  onShowContext: () => void;
  contextOpen: boolean;
  onInvestigate: () => void;
  onEscalate: () => void;
  onAssign: () => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{a.id}</span>
          <Pill tone={severityTone(a.severity)}>{a.severity}</Pill>
          <Pill tone={severityTone(a.status)}>{a.status}</Pill>
          <button onClick={onShowContext} className="ml-auto h-7 px-2 rounded-md border text-[11px] font-medium hover:bg-muted inline-flex items-center gap-1">
            <Code2 className="size-3" /> {contextOpen ? "Hide" : "View"} LLM Context
          </button>
        </div>
        <h3 className="mt-1.5 text-base font-semibold">{a.metric}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat l="Country" v={a.country} />
        <Stat l="MCC" v={a.mcc} />
        <Stat l="Channel" v={a.channel} />
        <Stat l="Impact" v={fmtMoney(a.impact)} />
        <Stat l="Affected Txns" v={a.affectedTxns.toLocaleString()} />
        <Stat l="AI Confidence" v={`${Math.round(a.confidence * 100)}%`} />
      </div>
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Root Causes</div>
        <ul className="space-y-1.5">
          {a.rootCauses.map((r) => (
            <li key={r} className="text-xs flex gap-2"><span className="mt-1.5 size-1.5 rounded-full bg-destructive shrink-0" />{r}</li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Recommendations</div>
        <ul className="space-y-1.5">
          {a.recommendations.map((r) => (
            <li key={r} className="text-xs flex gap-2"><span className="mt-1.5 size-1.5 rounded-full bg-success shrink-0" />{r}</li>
          ))}
        </ul>
      </div>
      {a.assignee && (
        <div className="rounded-md border bg-muted/40 p-2.5 text-xs flex items-center gap-2">
          <UserCheck className="size-3.5 text-accent" />
          <span className="text-muted-foreground">Assigned to</span>
          <span className="font-medium">{a.assignee}</span>
        </div>
      )}
      <div className="flex gap-2 pt-2 border-t">
        <button
          type="button"
          onClick={onInvestigate}
          disabled={a.status === "Closed" || a.status === "Resolved"}
          className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
          title="Run AI investigation"
        ><Sparkles className="size-3.5" /> Investigate</button>
        <button
          type="button"
          onClick={onEscalate}
          disabled={a.status === "Escalated"}
          className="flex-1 h-9 rounded-md border text-xs font-medium hover:bg-muted disabled:opacity-60"
        >Escalate</button>
        <button
          type="button"
          onClick={onAssign}
          className="h-9 px-3 rounded-md border text-xs font-medium hover:bg-muted"
        >Assign</button>
      </div>
    </div>
  );
}

function RationalePanel({ a }: { a: Anomaly }) {
  const r = detectionRationaleFor(a);
  const riskTone = r.falsePositiveRisk === "Low" ? "success" : r.falsePositiveRisk === "Medium" ? "warning" : "danger";
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="size-7 rounded-md bg-accent/10 text-accent grid place-items-center"><Microscope className="size-3.5" /></div>
        <div className="text-sm font-semibold">Detection Rationale</div>
        <Pill tone="info">{r.method}</Pill>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{r.why}</p>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <Stat l="Score" v={r.score} />
        <Stat l="Threshold" v={r.threshold} />
        <Stat l="Confidence" v={`${r.confidence}%`} />
        <div className="rounded-md border bg-background p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">False Positive Risk</div>
          <div className="mt-0.5"><Pill tone={riskTone}>{r.falsePositiveRisk}</Pill></div>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground italic">{r.falsePositiveReason}</p>
    </div>
  );
}

function DeclineBreakdownPanel({ a }: { a: Anomaly }) {
  const data = declineBreakdownFor(a.id).slice(0, 7);
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Decline Reason Breakdown</div>
        <div className="text-[11px] text-muted-foreground">Top codes for this anomaly</div>
      </div>
      <div className="h-52">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94A3B8" />
            <YAxis type="category" dataKey="code" tick={{ fontSize: 10 }} stroke="#94A3B8" width={42} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number, _n, item) => [`${v}%`, item?.payload?.label]} />
            <Bar dataKey="share" radius={[0, 4, 4, 0]}>
              {data.map((d, i) => <Cell key={i} fill={d.code === "R91" ? "#EF4444" : "#2563EB"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
        {data.slice(0, 6).map((d) => (
          <div key={d.code} className="flex items-center justify-between">
            <span><span className="font-mono mr-1.5">{d.code}</span><span className="text-muted-foreground">{d.label}</span></span>
            <span className={d.change > 0 ? "text-destructive font-medium" : "text-success font-medium"}>{d.change > 0 ? "+" : ""}{d.change}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContextPreview({ a }: { a: Anomaly }) {
  const ctx = buildAnomalyContext(a);
  const prompt = buildSystemPrompt(ctx);
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-2">
        <Code2 className="size-4 text-accent" />
        <div className="text-sm font-semibold">LLM Context Payload</div>
        <Pill tone="info">Sent to assistant</Pill>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2">This is the exact grounded payload injected into the assistant's system prompt for this anomaly.</p>
      <pre className="text-[10px] bg-muted/60 border rounded-md p-3 overflow-auto max-h-72 font-mono leading-relaxed">{prompt}</pre>
    </div>
  );
}

function Stat({ l, v }: { l: string; v: string }) {
  return (
    <div className="rounded-md border bg-background p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
      <div className="mt-0.5 font-medium tabular">{v}</div>
    </div>
  );
}
