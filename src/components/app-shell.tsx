import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode, type ComponentType } from "react";
import {
  LayoutDashboard, AlertTriangle, Bot, Briefcase, FileText, Bell, ShieldCheck,
  Search, Sparkles, ChevronRight, Settings, X, Activity, Network, Flame, BarChart3,
  Users, KeyRound, PanelLeftClose, PanelLeftOpen, LogOut, Power, ChevronDown,
  User as UserIcon, History, Sliders, LifeBuoy, Mail, Building2, SearchCheck,
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  clearSession, formatLastLogin, getRoleDef, getSession, hasPermission,
  PERMISSION_LABELS, ROLES, setSession, type Permission, type Role, type Session,
} from "@/lib/session";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  perm: Permission;
  tooltip: string;
  group: string;
};

const NAV: NavItem[] = [
  { to: "/app/dashboard",      label: "Dashboard",               icon: LayoutDashboard, perm: "dashboard",    group: "Monitoring",      tooltip: "Role-based operational overview of your portfolio." },
  { to: "/app/transactions",   label: "Transaction Monitoring",  icon: Activity,        perm: "transactions", group: "Monitoring",      tooltip: "Monitor volumes, approvals, declines, and fraud metrics." },
  { to: "/app/anomalies",      label: "Anomaly Detection",       icon: AlertTriangle,   perm: "anomalies",    group: "Detection",       tooltip: "AI-detected abnormal patterns across the platform." },
  { to: "/app/rca",            label: "Root Cause Analysis",     icon: Network,         perm: "rca",          group: "Detection",       tooltip: "Drill down into contributing factors for each anomaly." },
  { to: "/app/assistant",      label: "AI Diagnostic Assistant", icon: Bot,             perm: "assistant",    group: "Intelligence",    tooltip: "Ask questions and get grounded AI explanations." },
  { to: "/app/investigations", label: "Case Management",         icon: Briefcase,       perm: "cases",        group: "Investigations",  tooltip: "Create, assign, and track investigation cases." },
  { to: "/app/investigation",  label: "Investigation Module",    icon: SearchCheck,     perm: "investigation",group: "Investigations",  tooltip: "AI-assisted anomaly investigation workspace." },
  { to: "/app/incidents",      label: "Incident Management",     icon: Flame,           perm: "incidents",    group: "Investigations",  tooltip: "Manage operational and fraud incidents." },
  { to: "/app/fraud",          label: "Fraud Analytics",         icon: BarChart3,       perm: "fraud",        group: "Intelligence",    tooltip: "Review fraud trends, patterns, and attack vectors." },
  { to: "/app/reports",        label: "Reports & Analytics",     icon: FileText,        perm: "reports",      group: "Reporting",       tooltip: "Generate and export business reports." },
  { to: "/app/architecture",   label: "System Architecture",     icon: Building2,       perm: "help",         group: "Platform",        tooltip: "Solution, data, security, and deployment architecture." },
  { to: "/app/users",          label: "User Management",         icon: Users,           perm: "users",        group: "Administration",  tooltip: "Manage users, roles, and access controls." },
  { to: "/app/roles",          label: "Role Management",         icon: KeyRound,        perm: "roles",        group: "Administration",  tooltip: "Create and manage role-based permissions." },
  { to: "/app/audit",          label: "Audit Logs",              icon: ShieldCheck,     perm: "audit",        group: "Administration",  tooltip: "Review user activities and system changes." },
  { to: "/app/settings",       label: "Settings",                icon: Settings,        perm: "settings",     group: "Administration",  tooltip: "Configure system preferences." },
  { to: "/app/help",           label: "Help Center",             icon: LifeBuoy,        perm: "help",         group: "Support",         tooltip: "Documentation, FAQs, and support resources." },
];

const NAV_ORDER = ["Monitoring", "Detection", "Intelligence", "Investigations", "Reporting", "Platform", "Administration", "Support"];

function initials(email: string) {
  const name = email.split("@")[0] ?? "user";
  return name.slice(0, 2).toUpperCase();
}

function useSession(): Session | null {
  const [s, setS] = useState<Session | null>(null);
  useEffect(() => { setS(getSession()); }, []);
  return s;
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const session = useSession();
  const role = getRoleDef(session?.role);
  const visibleNav = useMemo(() => NAV.filter((n) => hasPermission(session?.role, n.perm)), [session?.role]);

  const current = NAV.find((n) => pathname.startsWith(n.to));
  const moduleName = current?.group ?? "Platform";
  const pageLabel = current?.label ?? title;

  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem("sentinel.sidebar.collapsed");
      if (v === "1") setCollapsed(true);
    } catch { /* ignore */ }
  }, []);
  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try { window.localStorage.setItem("sentinel.sidebar.collapsed", next ? "1" : "0"); } catch { /* */ }
      return next;
    });
  }

  function performLogout() {
    clearSession();
    setLogoutOpen(false);
    navigate({ to: "/login" });
  }

  function switchRole(r: Role) {
    if (!session) return;
    setSession({ email: session.email, role: r, loginAt: session.loginAt });
    window.location.reload();
  }

  const permissions = role.permissions === "all" ? (Object.keys(PERMISSION_LABELS) as Permission[]) : role.permissions;

  // Group nav items for sidebar
  const grouped = useMemo(() => {
    const map = new Map<string, NavItem[]>();
    for (const n of visibleNav) {
      const arr = map.get(n.group) ?? [];
      arr.push(n);
      map.set(n.group, arr);
    }
    return NAV_ORDER.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }));
  }, [visibleNav]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Sidebar */}
        <aside
          className={
            "hidden md:flex shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0 h-screen transition-[width] duration-200 " +
            (collapsed ? "w-16" : "w-64")
          }
          aria-label="Primary navigation"
        >
          <div className={"px-3 py-4 border-b border-sidebar-border flex items-center gap-2 " + (collapsed ? "justify-center" : "px-5")}>
            <div className="size-8 rounded-md gradient-brand grid place-items-center shadow-lg shadow-accent/20 shrink-0">
              <Sparkles className="size-4 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white tracking-tight truncate">Sentinel AI</div>
                <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Risk Intelligence</div>
              </div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto p-2 space-y-3" role="navigation">
            {grouped.map(({ group, items }) => (
              <div key={group}>
                {!collapsed && (
                  <div className="px-2 mb-1 text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold">{group}</div>
                )}
                <div className="space-y-0.5">
                  {items.map((n) => {
                    const Icon = n.icon;
                    const active = pathname.startsWith(n.to);
                    const link = (
                      <Link
                        to={n.to}
                        aria-label={n.label}
                        aria-current={active ? "page" : undefined}
                        className={
                          "group relative flex items-center gap-3 rounded-md text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/50 " +
                          (collapsed ? "justify-center px-2 py-2" : "px-3 py-2") + " " +
                          (active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white")
                        }
                      >
                        {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-accent" aria-hidden />}
                        <Icon className="size-4 shrink-0" />
                        {!collapsed && <span className="truncate">{n.label}</span>}
                      </Link>
                    );
                    return (
                      <Tooltip key={n.to}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="font-medium">{n.label}</div>
                          <div className="text-[11px] opacity-80 mt-0.5">{n.tooltip}</div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-2 space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleCollapsed}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  className={"w-full flex items-center gap-3 rounded-md text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white " + (collapsed ? "justify-center px-2 py-2" : "px-3 py-2")}
                >
                  {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                  {!collapsed && <span>Collapse</span>}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setLogoutOpen(true)}
                  aria-label="Logout"
                  className={"w-full flex items-center gap-3 rounded-md text-xs text-destructive/90 hover:bg-destructive/15 hover:text-destructive transition " + (collapsed ? "justify-center px-2 py-2" : "px-3 py-2")}
                >
                  <Power className="size-4" />
                  {!collapsed && <span>Logout</span>}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="font-medium">Logout</div>
                <div className="text-[11px] opacity-80">End your session and return to login.</div>
              </TooltipContent>
            </Tooltip>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Sticky header — simplified */}
          <header className="h-16 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 flex items-center px-3 md:px-5 gap-3 sticky top-0 z-30 shadow-sm">
            {/* Left: brand */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="size-8 rounded-md gradient-brand grid place-items-center md:hidden">
                <Sparkles className="size-4 text-white" />
              </div>
              <div className="hidden lg:flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight">Sentinel AI</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Risk Intelligence</span>
              </div>
            </div>

            {/* Center: breadcrumbs */}
            <div className="hidden md:flex items-center text-xs text-muted-foreground gap-1.5 min-w-0">
              <Link to="/app/dashboard" className="hover:text-foreground">Home</Link>
              <ChevronRight className="size-3" />
              <span className="text-muted-foreground">{moduleName}</span>
              <ChevronRight className="size-3" />
              <span className="text-foreground font-medium truncate">{pageLabel}</span>
            </div>

            {/* Right: search, notifications, theme, role, profile */}
            <div className="ml-auto flex items-center gap-1.5">
              <div className="relative hidden md:block">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Search anomalies, cases, merchants…"
                  aria-label="Global search"
                  className="h-9 w-56 lg:w-72 rounded-md border bg-background pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <NotificationsBell />
              <ThemeToggle />

              {/* Role popover with role switcher */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="hidden md:inline-flex items-center gap-2 h-9 px-2.5 rounded-md border bg-background hover:bg-muted text-xs"
                    aria-label="Active role"
                  >
                    <ShieldCheck className="size-3.5 text-accent" />
                    <span className="font-medium">{role.short}</span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-md bg-accent/15 text-accent grid place-items-center"><ShieldCheck className="size-4" /></div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{role.label}</div>
                        <div className="text-[11px] text-muted-foreground">Active role · {permissions.length} permissions</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{role.description}</p>
                  </div>
                  <div className="p-3 border-b">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 px-1">Switch role</div>
                    <div className="grid gap-1">
                      {ROLES.map((r) => (
                        <button
                          key={r.value}
                          onClick={() => switchRole(r.value)}
                          className={"flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted " + (r.value === role.value ? "bg-accent/10 text-accent font-medium" : "")}
                        >
                          <span>{r.label}</span>
                          {r.value === role.value && <span className="text-[10px]">Active</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Permissions</div>
                    <ul className="mt-2 grid grid-cols-1 gap-1">
                      {permissions.map((p) => (
                        <li key={p} className="flex items-center gap-2 text-xs">
                          <span className="text-success">✓</span>
                          <span>{PERMISSION_LABELS[p]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-md border bg-background hover:bg-muted" aria-label="Account menu">
                    <span className="size-7 rounded-full bg-accent/80 grid place-items-center text-[11px] font-semibold text-white">
                      {initials(session?.email ?? "JS")}
                    </span>
                    <span className="hidden lg:flex flex-col leading-tight text-left">
                      <span className="text-xs font-medium truncate max-w-[140px]">{session?.email ?? "guest@sentinel.ai"}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {role.short} · Last login {formatLastLogin(session?.loginAt)}
                      </span>
                    </span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="text-xs font-medium truncate">{session?.email ?? "guest@sentinel.ai"}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {role.label} · Last login {formatLastLogin(session?.loginAt)}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate({ to: "/app/users" })}>
                    <UserIcon className="size-4" /> My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate({ to: "/app/roles" })}>
                    <ShieldCheck className="size-4" /> Role Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate({ to: "/app/audit" })}>
                    <History className="size-4" /> Activity History
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate({ to: "/app/settings" })}>
                    <Sliders className="size-4" /> Preferences
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate({ to: "/app/notifications" })}>
                    <Mail className="size-4" /> Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate({ to: "/app/help" })}>
                    <LifeBuoy className="size-4" /> Help
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setLogoutOpen(true)} className="text-destructive focus:text-destructive">
                    <LogOut className="size-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page heading */}
          <div className="px-4 md:px-6 py-5 border-b bg-card/60">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </div>

          <main className="flex-1 p-4 md:p-6 min-w-0">{children}</main>
        </div>

        {/* Logout confirmation modal */}
        {logoutOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="logout-title">
            <div className="absolute inset-0 bg-black/50" onClick={() => setLogoutOpen(false)} />
            <div className="relative w-full max-w-sm rounded-xl border bg-card shadow-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-destructive/10 text-destructive grid place-items-center shrink-0">
                  <Power className="size-5" />
                </div>
                <div className="flex-1">
                  <div id="logout-title" className="text-base font-semibold">Are you sure you want to logout?</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your session will be cleared and you'll be returned to the login screen.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button onClick={() => setLogoutOpen(false)} className="h-9 px-3 rounded-md border text-xs font-medium hover:bg-muted">Cancel</button>
                <button onClick={performLogout} className="h-9 px-3 rounded-md bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 inline-flex items-center gap-1.5">
                  <LogOut className="size-3.5" /> Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function NotificationsBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const items = [
    { t: "R91 timeouts spiked", b: "Issuer BIN 414709 — +370% vs baseline", tone: "text-destructive" },
    { t: "Case CASE-014 assigned", b: "Travel MCC anomaly · escalated to Tier-2", tone: "text-warning" },
    { t: "AI Insight ready", b: "Approval rate drop diagnosed — view analysis", tone: "text-accent" },
  ];
  return (
    <div className="relative" ref={ref}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Notifications"
            className="relative h-9 w-9 grid place-items-center rounded-md border bg-background hover:bg-muted"
          >
            <Bell className="size-4" />
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-semibold grid place-items-center">3</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="font-medium">Notification Center</div>
          <div className="text-[11px] opacity-80">3 unread alerts.</div>
        </TooltipContent>
      </Tooltip>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-popover shadow-xl z-40 overflow-hidden">
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <div className="text-xs font-semibold">Notifications</div>
            <button onClick={() => { setOpen(false); navigate({ to: "/app/notifications" }); }} className="text-[11px] text-accent hover:underline">View all</button>
          </div>
          <ul className="divide-y">
            {items.map((it) => (
              <li key={it.t} className="px-3 py-2.5">
                <div className={"text-xs font-medium " + it.tone}>{it.t}</div>
                <div className="text-[11px] text-muted-foreground">{it.b}</div>
              </li>
            ))}
          </ul>
          {/* close icon visually used elsewhere */}
          <span className="hidden"><X /></span>
        </div>
      )}
    </div>
  );
}

export function Pill({
  tone = "neutral",
  children,
}: { tone?: "neutral" | "success" | "warning" | "danger" | "info"; children: ReactNode }) {
  const map = {
    neutral: "bg-muted text-muted-foreground border-border",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/30",
    danger: "bg-destructive/10 text-destructive border-destructive/20",
    info: "bg-accent/10 text-accent border-accent/20",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${map[tone]}`}>
      {children}
    </span>
  );
}

export function severityTone(s: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (s === "Critical") return "danger";
  if (s === "High") return "warning";
  if (s === "Medium") return "info";
  if (s === "Low") return "success";
  if (s === "Resolved" || s === "Closed") return "success";
  if (s === "Open") return "warning";
  if (s === "Investigating" || s === "Escalated") return "info";
  return "neutral";
}

export function GroundingBadge({ tier }: { tier: "grounded" | "partial" | "insufficient" }) {
  const map = {
    grounded: { tone: "success" as const, label: "Grounded — based on anomaly data" },
    partial: { tone: "warning" as const, label: "Partial — some inference involved" },
    insufficient: { tone: "danger" as const, label: "Insufficient data — treat with caution" },
  };
  const m = map[tier];
  return (
    <span
      title="This response was generated strictly from detected anomaly metrics. No external knowledge was used."
      className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium " + (
        m.tone === "success" ? "bg-success/10 text-success border-success/20" :
        m.tone === "warning" ? "bg-warning/10 text-warning border-warning/30" :
        "bg-destructive/10 text-destructive border-destructive/20"
      )}
    >
      <span className={"size-1.5 rounded-full " + (m.tone === "success" ? "bg-success" : m.tone === "warning" ? "bg-warning" : "bg-destructive")} />
      {m.label}
    </span>
  );
}
