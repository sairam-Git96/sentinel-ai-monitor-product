import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Pill } from "@/components/app-shell";
import { REPORTS } from "@/lib/mock-data";
import { Download, FileText, FileSpreadsheet, Presentation, FileDown, Calendar, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { downloadCSV } from "@/lib/export";
import { InfoTooltip } from "@/components/info-tooltip";
import { ModuleActions } from "@/components/module-actions";

export const Route = createFileRoute("/app/reports")({
  head: () => ({ meta: [{ title: "Reports · Sentinel AI" }] }),
  component: Reports,
});

const SCHEDULES = [
  { id: "SCH-01", name: "Weekly Executive Digest", cadence: "Mon 08:00", recipients: 8,  next: "Mon, 8:00 AM" },
  { id: "SCH-02", name: "Daily Fraud Snapshot",    cadence: "Daily 07:00", recipients: 12, next: "Tomorrow, 7:00 AM" },
  { id: "SCH-03", name: "Monthly Compliance Pack", cadence: "1st of month", recipients: 4,  next: "Jul 1, 9:00 AM" },
];

function Reports() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [draft, setDraft] = useState({ report: REPORTS[0]?.name ?? "", cadence: "Weekly", emails: "" });

  function exportReport(report: typeof REPORTS[number], format: string) {
    if (format === "CSV") {
      downloadCSV([{ name: report.name, description: report.desc, updated: report.updated, size: report.size }], `${report.id}.csv`);
    }
    toast.success(`${report.name} exported as ${format}.`);
  }

  function schedule() {
    if (!draft.emails.trim()) { toast.error("Add at least one recipient email."); return; }
    setScheduleOpen(false);
    toast.success(`Scheduled "${draft.report}" — ${draft.cadence}.`);
  }

  return (
    <AppShell
      title="Reporting Center"
      subtitle="Ready-to-share reports across risk, fraud, operations, and executive views."
      actions={
        <div className="flex items-center gap-1.5">
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogTrigger asChild>
              <button className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5">
                <Mail className="size-3.5" /> Schedule Email
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Schedule a report</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <label className="block text-xs">
                  <span className="text-muted-foreground">Report</span>
                  <select value={draft.report} onChange={(e) => setDraft({ ...draft, report: e.target.value })} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs">
                    {REPORTS.map((r) => <option key={r.id}>{r.name}</option>)}
                  </select>
                </label>
                <label className="block text-xs">
                  <span className="text-muted-foreground">Cadence</span>
                  <select value={draft.cadence} onChange={(e) => setDraft({ ...draft, cadence: e.target.value })} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs">
                    {["Daily", "Weekly", "Monthly"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block text-xs">
                  <span className="text-muted-foreground">Recipients (comma-separated)</span>
                  <input value={draft.emails} onChange={(e) => setDraft({ ...draft, emails: e.target.value })} placeholder="ops@acme.com, risk@acme.com" className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs" />
                </label>
              </div>
              <DialogFooter>
                <button onClick={() => setScheduleOpen(false)} className="h-9 px-3 rounded-md border text-xs">Cancel</button>
                <button onClick={schedule} className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs">Schedule</button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ModuleActions module="Reports" rows={REPORTS.map((r) => ({ id: r.id, name: r.name, updated: r.updated, size: r.size }))} />
        </div>
      }
    >
      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORTS.map((r) => (
              <div key={r.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="size-10 rounded-md bg-accent/10 text-accent grid place-items-center"><FileText className="size-5" /></div>
                  <Pill tone="info">{r.size}</Pill>
                </div>
                <div className="mt-4 font-semibold flex items-center gap-1.5">
                  {r.name}
                  <InfoTooltip tip={{ title: r.name, definition: r.desc, purpose: "Pre-built dashboard for export and email delivery." }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
                <div className="mt-3 text-[11px] text-muted-foreground">Updated {r.updated}</div>
                <div className="mt-4 grid grid-cols-4 gap-1.5">
                  <ExportBtn icon={<FileDown className="size-3" />}        label="PDF"   onClick={() => { window.print(); toast.message("Use 'Save as PDF' in the print dialog."); }} />
                  <ExportBtn icon={<FileSpreadsheet className="size-3" />} label="Excel" onClick={() => exportReport(r, "Excel")} />
                  <ExportBtn icon={<FileText className="size-3" />}        label="CSV"   onClick={() => exportReport(r, "CSV")} />
                  <ExportBtn icon={<Presentation className="size-3" />}    label="PPT"   onClick={() => exportReport(r, "PPT")} />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="mt-4">
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2">Schedule</th>
                  <th className="text-left px-4 py-2">Cadence</th>
                  <th className="text-left px-4 py-2">Recipients</th>
                  <th className="text-left px-4 py-2">Next run</th>
                  <th className="text-right px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {SCHEDULES.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2">
                      <div className="text-xs text-muted-foreground">{s.id}</div>
                      <div className="text-sm font-medium">{s.name}</div>
                    </td>
                    <td className="px-4 py-2 text-xs"><Calendar className="size-3 inline mr-1 text-muted-foreground" />{s.cadence}</td>
                    <td className="px-4 py-2 text-xs">{s.recipients}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{s.next}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => toast.success(`${s.id} sent now.`)} className="h-7 px-2 rounded border text-[11px] hover:bg-muted mr-1.5">Send now</button>
                      <button onClick={() => toast.message(`${s.id} paused.`)} className="h-7 px-2 rounded border text-[11px] hover:bg-muted">Pause</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function ExportBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="h-7 rounded-md border text-[10px] font-medium hover:bg-muted inline-flex items-center justify-center gap-1">
      {icon} {label}
    </button>
  );
}
