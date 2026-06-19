import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { generateAudit } from "@/lib/mock-data";
import { Search } from "lucide-react";
import { ModuleActions } from "@/components/module-actions";
import { RangeFilter, type RangeDays } from "@/components/range-filter";

export const Route = createFileRoute("/app/audit")({
  head: () => ({ meta: [{ title: "Audit Logs · Sentinel AI" }] }),
  component: Audit,
});

function Audit() {
  const all = useMemo(() => generateAudit(400), []);
  const [q, setQ] = useState("");
  const [range, setRange] = useState<RangeDays>(30);
  const cutoff = Date.now() - range * 86400000;
  const list = all.filter((l) => {
    const t = new Date(l.timestamp).getTime();
    if (t < cutoff) return false;
    return !q || `${l.user} ${l.action} ${l.target} ${l.ip}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <AppShell
      title="Audit Logs"
      subtitle="Immutable record of user actions, system events, and AI-generated outputs."
      actions={
        <div className="flex items-center gap-1.5">
          <RangeFilter value={range} onChange={setRange} />
          <ModuleActions module="Audit Logs" rows={list} />
        </div>
      }
    >
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-3 border-b flex items-center gap-2">
          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user, action, target, IP…" className="h-9 w-80 rounded-md border bg-background pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
          <div className="ml-auto text-xs text-muted-foreground">{list.length} of {all.length} events · last {range}d</div>
        </div>
        <div className="overflow-x-auto max-h-[680px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted text-[11px] uppercase tracking-wider text-foreground border-b-2 border-border shadow-sm">
              <tr>{["Event ID", "Timestamp", "User", "Action", "Target", "IP"].map((h) =>
                <th key={h} className="text-left font-semibold px-3 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id} className="border-t hover:bg-muted/40">
                  <td className="px-3 py-2.5 font-mono text-xs">{l.id}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground tabular">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="px-3 py-2.5">{l.user}</td>
                  <td className="px-3 py-2.5"><span className="text-xs font-medium">{l.action}</span></td>
                  <td className="px-3 py-2.5 text-xs">{l.target}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
