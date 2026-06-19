import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Pill, severityTone } from "@/components/app-shell";
import { InfoTooltip } from "@/components/info-tooltip";
import { ModuleActions } from "@/components/module-actions";
import { Flame, Clock, Users, Plus, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/app/incidents")({
  head: () => ({ meta: [{ title: "Incident Management · Sentinel AI" }] }),
  component: Page,
});

type Incident = { id: string; title: string; severity: string; status: string; owner: string; opened: string; impact: string };

const INITIAL: Incident[] = [
  { id: "INC-2041", title: "Issuer BIN 414709 timeout surge",  severity: "Critical", status: "Open",          owner: "S. Patel", opened: "12m ago",  impact: "8.4K declines" },
  { id: "INC-2039", title: "3DS step-up latency · EU",         severity: "High",     status: "Investigating", owner: "M. Chen",  opened: "1h ago",   impact: "+2.1s p95" },
  { id: "INC-2036", title: "Fraud spike · Travel MCC USA",     severity: "High",     status: "Escalated",     owner: "R. Gomez", opened: "3h ago",   impact: "$184K exposure" },
  { id: "INC-2031", title: "Network route failover · Visa US", severity: "Medium",   status: "Resolved",      owner: "Ops Bot",  opened: "Yesterday",impact: "Auto-mitigated" },
  { id: "INC-2028", title: "Velocity rule false positives",    severity: "Low",      status: "Closed",        owner: "J. Smith", opened: "2d ago",   impact: "Rule tuned" },
];

function Page() {
  const [list, setList] = useState<Incident[]>(INITIAL);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", severity: "Medium", owner: "" });

  const filtered = useMemo(() => {
    return list.filter((i) => {
      const matchQ = !q || i.title.toLowerCase().includes(q.toLowerCase()) || i.id.toLowerCase().includes(q.toLowerCase());
      const matchT =
        tab === "all" ? true :
        tab === "open" ? i.status === "Open" || i.status === "Investigating" || i.status === "Escalated" :
        tab === "resolved" ? i.status === "Resolved" || i.status === "Closed" :
        true;
      return matchQ && matchT;
    });
  }, [list, q, tab]);

  function createIncident() {
    if (!draft.title.trim()) { toast.error("Title is required."); return; }
    const id = `INC-${2100 + list.length}`;
    setList((l) => [{ id, title: draft.title, severity: draft.severity, status: "Open", owner: draft.owner || "Unassigned", opened: "just now", impact: "—" }, ...l]);
    setDraft({ title: "", severity: "Medium", owner: "" });
    setOpen(false);
    toast.success(`${id} created.`);
  }

  function advance(i: Incident) {
    const next: Record<string, string> = { Open: "Investigating", Investigating: "Escalated", Escalated: "Resolved", Resolved: "Closed", Closed: "Closed" };
    setList((l) => l.map((x) => x.id === i.id ? { ...x, status: next[x.status] ?? x.status } : x));
    toast.message(`${i.id} → ${next[i.status]}`);
  }

  return (
    <AppShell
      title="Incident Management"
      subtitle="Operational and fraud incidents across the platform."
      actions={
        <div className="flex items-center gap-1.5">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5">
                <Plus className="size-3.5" /> New incident
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create incident</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <label className="block text-xs">
                  <span className="text-muted-foreground">Title</span>
                  <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs" />
                </label>
                <label className="block text-xs">
                  <span className="text-muted-foreground">Severity</span>
                  <select value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value })} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs">
                    {["Critical", "High", "Medium", "Low"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label className="block text-xs">
                  <span className="text-muted-foreground">Owner</span>
                  <input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Unassigned" className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs" />
                </label>
              </div>
              <DialogFooter>
                <button onClick={() => setOpen(false)} className="h-9 px-3 rounded-md border text-xs">Cancel</button>
                <button onClick={createIncident} className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs">Create</button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ModuleActions module="Incidents" rows={filtered} />
        </div>
      }
    >
      <div className="grid md:grid-cols-4 gap-4 mb-4">
        {[
          { l: "Open Incidents",      v: String(list.filter((i) => i.status === "Open" || i.status === "Investigating" || i.status === "Escalated").length), icon: Flame,  tone: "text-destructive", tip: "active_alerts" },
          { l: "Mean Time to Detect", v: "4m 12s",  icon: Clock, tone: "text-accent",   tip: "active_alerts" },
          { l: "Mean Time to Resolve",v: "38m",      icon: Clock, tone: "text-warning",  tip: "active_alerts" },
          { l: "On-call Engineers",   v: "5",        icon: Users, tone: "text-success",  tip: "active_alerts" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border bg-card p-5 flex items-center gap-3">
            <div className={"size-10 rounded-lg bg-muted grid place-items-center " + k.tone}><k.icon className="size-5" /></div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">{k.l} <InfoTooltip tip={k.tip as never} /></div>
              <div className="text-xl font-semibold">{k.v}</div>
            </div>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between mb-3">
          <TabsList>
            <TabsTrigger value="all">All ({list.length})</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter incidents…"
              className="h-9 w-56 rounded-md border bg-background pl-8 pr-3 text-xs"
            />
          </div>
        </div>

        <TabsContent value={tab}>
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2">Incident</th>
                  <th className="text-left px-4 py-2">Severity <InfoTooltip tip="severity" /></th>
                  <th className="text-left px-4 py-2">Status <InfoTooltip tip="status" /></th>
                  <th className="text-left px-4 py-2">Owner</th>
                  <th className="text-left px-4 py-2">Opened</th>
                  <th className="text-left px-4 py-2">Impact</th>
                  <th className="text-right px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2">
                      <div className="text-xs text-muted-foreground">{i.id}</div>
                      <div className="text-sm font-medium">{i.title}</div>
                    </td>
                    <td className="px-4 py-2"><Pill tone={severityTone(i.severity)}>{i.severity}</Pill></td>
                    <td className="px-4 py-2"><Pill tone={severityTone(i.status)}>{i.status}</Pill></td>
                    <td className="px-4 py-2 text-xs">{i.owner}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{i.opened}</td>
                    <td className="px-4 py-2 text-xs">{i.impact}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => advance(i)}
                        className="h-7 px-2 rounded border text-[11px] hover:bg-muted"
                        disabled={i.status === "Closed"}
                      >Advance</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground">No incidents match the current filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
