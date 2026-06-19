import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Pill } from "@/components/app-shell";
import { PERMISSION_LABELS, ROLES, type Permission } from "@/lib/session";
import { KeyRound, ShieldCheck, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoTooltip } from "@/components/info-tooltip";
import { ModuleActions } from "@/components/module-actions";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/app/roles")({
  head: () => ({ meta: [{ title: "Role Management · Sentinel AI" }] }),
  component: Page,
});

function Page() {
  const allPerms = Object.keys(PERMISSION_LABELS) as Permission[];
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ label: "", description: "" });

  const matrix = ROLES.map((r) => ({
    role: r.label,
    ...Object.fromEntries(allPerms.map((p) => [p, (r.permissions === "all" ? allPerms : r.permissions).includes(p) ? "✓" : ""])),
  }));

  return (
    <AppShell
      title="Role Management"
      subtitle="Define roles and the permissions they grant across the platform."
      actions={
        <div className="flex items-center gap-1.5">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5">
                <Plus className="size-3.5" /> New role
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create custom role</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <label className="block text-xs">
                  <span className="text-muted-foreground">Role name</span>
                  <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs" />
                </label>
                <label className="block text-xs">
                  <span className="text-muted-foreground">Description</span>
                  <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="mt-1 min-h-20 w-full rounded-md border bg-background px-2 py-1.5 text-xs" />
                </label>
              </div>
              <DialogFooter>
                <button onClick={() => setOpen(false)} className="h-9 px-3 rounded-md border text-xs">Cancel</button>
                <button
                  onClick={() => {
                    if (!draft.label.trim()) { toast.error("Role name is required."); return; }
                    setOpen(false);
                    toast.success(`Role "${draft.label}" created (mock).`);
                    setDraft({ label: "", description: "" });
                  }}
                  className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs"
                >Create</button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ModuleActions module="Roles" rows={matrix} />
        </div>
      }
    >
      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards">Role cards</TabsTrigger>
          <TabsTrigger value="matrix">Permission matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {ROLES.map((r) => {
              const perms: Permission[] = r.permissions === "all" ? allPerms : r.permissions;
              return (
                <div key={r.value} className="rounded-xl border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-lg bg-accent/15 text-accent grid place-items-center"><ShieldCheck className="size-5" /></div>
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-1.5">
                          {r.label}
                          <InfoTooltip tip={{ title: r.label, definition: r.description, purpose: `Grants ${perms.length} of ${allPerms.length} permissions.` }} />
                        </div>
                        <div className="text-[11px] text-muted-foreground">{perms.length} permissions</div>
                      </div>
                    </div>
                    <Pill tone="info"><KeyRound className="size-3" /> {r.short}</Pill>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{r.description}</p>
                  <div className="mt-4 grid grid-cols-2 gap-1.5">
                    {allPerms.map((p) => {
                      const has = perms.includes(p);
                      return (
                        <div key={p} className={"flex items-center gap-2 text-xs rounded-md border px-2 py-1.5 " + (has ? "bg-success/5 border-success/20" : "bg-muted/30 border-border opacity-60")}>
                          <span className={has ? "text-success" : "text-muted-foreground"}>{has ? "✓" : "○"}</span>
                          <span className="truncate">{PERMISSION_LABELS[p]}</span>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => toast.message(`Editing "${r.label}"…`, { description: "Permission editor opens here." })}
                    className="mt-3 h-8 w-full rounded-md border text-xs hover:bg-muted"
                  >Edit permissions</button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <div className="rounded-xl border bg-card overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 sticky left-0 bg-muted/40">Role</th>
                  {allPerms.map((p) => (
                    <th key={p} className="px-3 py-2 text-left whitespace-nowrap">{PERMISSION_LABELS[p]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLES.map((r) => {
                  const perms: Permission[] = r.permissions === "all" ? allPerms : r.permissions;
                  return (
                    <tr key={r.value} className="border-t hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium sticky left-0 bg-card">{r.label}</td>
                      {allPerms.map((p) => (
                        <td key={p} className="px-3 py-2">
                          {perms.includes(p) ? <span className="text-success">✓</span> : <span className="text-muted-foreground/50">—</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
