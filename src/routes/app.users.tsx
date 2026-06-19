import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Pill } from "@/components/app-shell";
import { ROLES } from "@/lib/session";
import { UserPlus, Search, MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { InfoTooltip } from "@/components/info-tooltip";
import { ModuleActions } from "@/components/module-actions";

export const Route = createFileRoute("/app/users")({
  head: () => ({ meta: [{ title: "User Management · Sentinel AI" }] }),
  component: Page,
});

type User = { name: string; email: string; role: string; status: string; last: string };

const SEED: User[] = [
  { name: "John Smith",   email: "john.smith@sentinel.ai",   role: "super_admin",         status: "Active",  last: "Just now" },
  { name: "Aisha Khan",   email: "aisha.khan@sentinel.ai",   role: "risk_analyst",        status: "Active",  last: "12m ago" },
  { name: "Rafael Gomez", email: "rafael.gomez@sentinel.ai", role: "fraud_investigator",  status: "Active",  last: "1h ago" },
  { name: "Maria Chen",   email: "maria.chen@sentinel.ai",   role: "ops_manager",         status: "Active",  last: "3h ago" },
  { name: "Devon Wright", email: "devon.wright@sentinel.ai", role: "compliance_officer",  status: "Invited", last: "—" },
  { name: "Priya Shah",   email: "priya.shah@sentinel.ai",   role: "executive",           status: "Active",  last: "Yesterday" },
];

function Page() {
  const [users, setUsers] = useState<User[]>(SEED);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", role: "risk_analyst" });

  const filtered = useMemo(
    () => users.filter((u) => !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())),
    [users, q]
  );

  function invite() {
    if (!draft.name.trim() || !draft.email.trim()) { toast.error("Name and email are required."); return; }
    setUsers((u) => [...u, { ...draft, status: "Invited", last: "—" }]);
    setDraft({ name: "", email: "", role: "risk_analyst" });
    setOpen(false);
    toast.success(`Invitation sent to ${draft.email}.`);
  }

  function toggleStatus(u: User) {
    setUsers((list) => list.map((x) => x.email === u.email ? { ...x, status: x.status === "Active" ? "Disabled" : "Active" } : x));
    toast.message(`${u.name} ${u.status === "Active" ? "disabled" : "enabled"}.`);
  }

  function remove(u: User) {
    setUsers((list) => list.filter((x) => x.email !== u.email));
    toast.success(`${u.name} removed.`);
  }

  return (
    <AppShell
      title="User Management"
      subtitle="Manage workspace members, roles, and access."
      actions={
        <div className="flex items-center gap-1.5">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5">
                <UserPlus className="size-3.5" /> Invite user
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite user</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <label className="block text-xs">
                  <span className="text-muted-foreground">Full name</span>
                  <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs" />
                </label>
                <label className="block text-xs">
                  <span className="text-muted-foreground">Email</span>
                  <input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs" />
                </label>
                <label className="block text-xs">
                  <span className="text-muted-foreground">Role</span>
                  <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs">
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </label>
              </div>
              <DialogFooter>
                <button onClick={() => setOpen(false)} className="h-9 px-3 rounded-md border text-xs">Cancel</button>
                <button onClick={invite} className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs">Send invite</button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ModuleActions module="Users" rows={filtered} />
        </div>
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{filtered.length} of {users.length} users</div>
        <div className="relative">
          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="h-9 w-56 rounded-md border bg-background pl-8 pr-3 text-xs" />
        </div>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">User</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Role <InfoTooltip tip={{ title: "Role", definition: "Determines which modules and actions the user can access.", purpose: "Enforces least-privilege access across the platform.", action: "Edit Role Management to change a role's permission set." }} /></th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Last activity</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const role = ROLES.find((r) => r.value === u.role);
              return (
                <tr key={u.email} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2 flex items-center gap-2">
                    <span className="size-7 rounded-full bg-accent/80 text-white text-[10px] grid place-items-center font-semibold">
                      {u.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                    <span>{u.name}</span>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2 text-xs">{role?.label ?? u.role}</td>
                  <td className="px-4 py-2"><Pill tone={u.status === "Active" ? "success" : u.status === "Invited" ? "warning" : "danger"}>{u.status}</Pill></td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{u.last}</td>
                  <td className="px-4 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button aria-label="Row actions" className="h-7 w-7 inline-flex items-center justify-center rounded border hover:bg-muted"><MoreHorizontal className="size-3.5" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.message(`Reset link sent to ${u.email}.`)}>Send password reset</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(u)}>{u.status === "Active" ? "Disable" : "Enable"} user</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => remove(u)} className="text-destructive">Remove user</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
