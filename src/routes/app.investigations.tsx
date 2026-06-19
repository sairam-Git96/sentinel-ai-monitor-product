import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Pill, severityTone } from "@/components/app-shell";
import { generateAnomalies, generateInvestigations, type Investigation, type Severity } from "@/lib/mock-data";
import { Plus } from "lucide-react";
import { ModuleActions } from "@/components/module-actions";
import { RangeFilter, type RangeDays } from "@/components/range-filter";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/app/investigations")({
  head: () => ({ meta: [{ title: "Investigations · Sentinel AI" }] }),
  component: Investigations,
});

function Investigations() {
  const anomalies = useMemo(() => generateAnomalies(25), []);
  const initial = useMemo(() => generateInvestigations(anomalies, 15), [anomalies]);
  const [cases, setCases] = useState<Investigation[]>(initial);
  const [range, setRange] = useState<RangeDays>(60);
  const cutoff = Date.now() - range * 86400000;
  const visible = useMemo(
    () => cases.filter((c) => new Date(c.created).getTime() >= cutoff),
    [cases, cutoff],
  );
  const [selected, setSelected] = useState<Investigation>(initial[0]);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", assignee: "", priority: "Medium" as Severity, notes: "" });

  function createCase() {
    if (!draft.name.trim()) { toast.error("Case name is required."); return; }
    const id = `CASE-${(cases.length + 1).toString().padStart(3, "0")}`;
    const newCase: Investigation = {
      id,
      name: draft.name,
      assignee: draft.assignee || "Unassigned",
      priority: draft.priority,
      status: "Open",
      created: new Date().toISOString(),
      notes: draft.notes || "Newly opened case awaiting triage.",
      anomalyId: anomalies[0].id,
    };
    setCases((c) => [newCase, ...c]);
    setSelected(newCase);
    setDraft({ name: "", assignee: "", priority: "Medium", notes: "" });
    setOpen(false);
    toast.success(`${id} created.`);
  }

  const stageCounts = ["Open", "Investigating", "Escalated", "Resolved", "Closed"].map((s) =>
    ({ s, n: visible.filter((c) => c.status === s).length })
  );

  return (
    <AppShell
      title="Investigation Management"
      subtitle="Active cases, assignments, and workflow status across the risk team."
      actions={
        <div className="flex items-center gap-1.5">
          <RangeFilter value={range} onChange={setRange} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs inline-flex items-center gap-1.5 hover:opacity-90"
              ><Plus className="size-3.5" /> New Case</button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Open a new investigation case</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <label className="block text-xs">
                  <span className="text-muted-foreground">Case name</span>
                  <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Fraud spike — UK E-Commerce" className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs">
                    <span className="text-muted-foreground">Assignee</span>
                    <input value={draft.assignee} onChange={(e) => setDraft({ ...draft, assignee: e.target.value })} placeholder="Unassigned" className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs" />
                  </label>
                  <label className="block text-xs">
                    <span className="text-muted-foreground">Priority</span>
                    <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as Severity })} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs">
                      {["Critical", "High", "Medium", "Low"].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block text-xs">
                  <span className="text-muted-foreground">Initial notes</span>
                  <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={3} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-xs" />
                </label>
              </div>
              <DialogFooter>
                <button onClick={() => setOpen(false)} className="h-9 px-3 rounded-md border text-xs">Cancel</button>
                <button onClick={createCase} className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs">Create case</button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ModuleActions module="Investigations" rows={visible} />
        </div>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stageCounts.map((s) => (
          <div key={s.s} className="rounded-xl border bg-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.s}</div>
            <div className="mt-1 text-2xl font-semibold tabular">{s.n}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-[11px] uppercase tracking-wider text-foreground border-b-2 border-border">
                <tr>{["Case ID", "Name", "Assignee", "Priority", "Status", "Created"].map((h) =>
                  <th key={h} className="text-left font-semibold px-3 py-3">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id} onClick={() => setSelected(c)} className={"border-t cursor-pointer " + (selected.id === c.id ? "bg-accent/5" : "hover:bg-muted/40")}>
                    <td className="px-3 py-2.5 font-mono text-xs">{c.id}</td>
                    <td className="px-3 py-2.5">{c.name}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="size-6 rounded-full bg-accent/15 text-accent grid place-items-center text-[10px] font-semibold">
                          {c.assignee.split(" ").map(s => s[0]).join("")}
                        </span>
                        <span className="text-xs">{c.assignee}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5"><Pill tone={severityTone(c.priority)}>{c.priority}</Pill></td>
                    <td className="px-3 py-2.5"><Pill tone={severityTone(c.status)}>{c.status}</Pill></td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{new Date(c.created).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{selected.id}</span>
              <Pill tone={severityTone(selected.priority)}>{selected.priority}</Pill>
              <Pill tone={severityTone(selected.status)}>{selected.status}</Pill>
            </div>
            <h3 className="mt-1.5 text-base font-semibold">{selected.name}</h3>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border bg-background p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Assignee</div>
              <div className="mt-0.5 font-medium">{selected.assignee}</div>
            </div>
            <div className="rounded-md border bg-background p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Anomaly</div>
              <div className="mt-0.5 font-medium font-mono text-xs">{selected.anomalyId}</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Workflow</div>
            <ol className="space-y-2">
              {["Open", "Assigned", "Investigating", "Escalated", "Resolved", "Closed"].map((s, i) => {
                const active = i <= ["Open","Investigating","Escalated","Resolved","Closed"].indexOf(selected.status) + 1;
                return (
                  <li key={s} className="flex items-center gap-2 text-xs">
                    <span className={`size-5 rounded-full grid place-items-center text-[10px] font-semibold ${active ? "bg-accent text-white" : "bg-muted text-muted-foreground"}`}>{i+1}</span>
                    <span className={active ? "" : "text-muted-foreground"}>{s}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Resolution Notes</div>
            <p className="text-xs text-muted-foreground leading-relaxed">{selected.notes}</p>
          </div>

          <div className="flex gap-2 pt-3 border-t">
            <button className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">Update Status</button>
            <button className="flex-1 h-9 rounded-md border text-xs font-medium hover:bg-muted">Add Comment</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
