import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Pill, severityTone } from "@/components/app-shell";
import { generateNotifications, type NotificationItem } from "@/lib/mock-data";
import { Bell, AlertTriangle, ShieldAlert, Briefcase, Settings, CheckCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ModuleActions } from "@/components/module-actions";
import { toast } from "sonner";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications · Sentinel AI" }] }),
  component: Notifications,
});

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  fraud: ShieldAlert, approval: AlertTriangle, merchant: AlertTriangle, case: Briefcase, system: Settings,
};

function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>(() => generateNotifications(50));
  const [tab, setTab] = useState<"all" | "unread" | "fraud" | "case" | "system">("all");

  const list = useMemo(() => items.filter((n) => {
    if (tab === "all") return true;
    if (tab === "unread") return !n.read;
    return n.type === tab;
  }), [items, tab]);

  const unread = items.filter((n) => !n.read).length;

  function markAll() {
    setItems((l) => l.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked read.");
  }

  function toggleRead(id: string) {
    setItems((l) => l.map((n) => n.id === id ? { ...n, read: !n.read } : n));
  }

  return (
    <AppShell
      title="Notification Center"
      subtitle="Alerts on fraud spikes, approval issues, merchant failures, and case updates."
      actions={
        <div className="flex items-center gap-1.5">
          <button onClick={markAll} className="h-9 px-3 rounded-md border bg-card hover:bg-muted text-xs inline-flex items-center gap-1.5">
            <CheckCheck className="size-3.5" /> Mark all read
          </button>
          <ModuleActions module="Notifications" rows={list.map((n) => ({ id: n.id, type: n.type, title: n.title, severity: n.severity, read: n.read, time: n.time }))} />
        </div>
      }
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unread})</TabsTrigger>
          <TabsTrigger value="fraud">Fraud</TabsTrigger>
          <TabsTrigger value="case">Cases</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <div className="rounded-xl border bg-card overflow-hidden">
            <ul className="divide-y">
              {list.map((n) => {
                const I = ICONS[n.type] ?? Bell;
                return (
                  <li key={n.id} className={"flex items-start gap-3 px-5 py-3.5 hover:bg-muted/40 " + (!n.read ? "bg-accent/5" : "")}>
                    <div className="size-8 rounded-md bg-muted grid place-items-center shrink-0"><I className="size-4 text-muted-foreground" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium truncate">{n.title}</div>
                        <Pill tone={severityTone(n.severity)}>{n.severity}</Pill>
                        {!n.read && <span className="size-1.5 rounded-full bg-accent" />}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground shrink-0">{new Date(n.time).toLocaleString()}</div>
                    <button
                      onClick={() => toggleRead(n.id)}
                      className="h-7 px-2 rounded border text-[11px] hover:bg-muted shrink-0"
                      aria-label={n.read ? "Mark unread" : "Mark read"}
                    >{n.read ? "Mark unread" : "Mark read"}</button>
                  </li>
                );
              })}
              {list.length === 0 && (
                <li className="px-5 py-12 text-center text-xs text-muted-foreground">No notifications in this view.</li>
              )}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
