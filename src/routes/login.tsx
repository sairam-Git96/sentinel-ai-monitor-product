import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, Mail, Lock, Chrome, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { ROLES, setSession, type Role } from "@/lib/session";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login · Sentinel AI" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@sentinel.ai");
  const [pwd, setPwd] = useState("demo");
  const [role, setRole] = useState<Role>("super_admin");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !pwd.trim()) {
      setError("Enter an email and password to continue.");
      return;
    }
    if (!ROLES.some((r) => r.value === role)) {
      setError("Select a valid role.");
      return;
    }
    setSession({ email: email.trim(), role });
    navigate({ to: "/app/dashboard" });
  }

  function quickSignIn(r: Role) {
    setSession({ email: `${r}@sentinel.ai`, role: r });
    navigate({ to: "/app/dashboard" });
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex relative flex-col justify-between p-10 gradient-brand text-white overflow-hidden">
        <div className="absolute inset-0 ring-grid opacity-30" />
        <Link to="/" className="flex items-center gap-2 relative">
          <div className="size-8 rounded-md bg-white/10 grid place-items-center"><Sparkles className="size-4" /></div>
          <div>
            <div className="text-sm font-semibold">Sentinel AI</div>
            <div className="text-[10px] uppercase tracking-widest text-white/60">Risk Intelligence</div>
          </div>
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight">Monitor millions of authorizations. Diagnose in seconds.</h2>
          <p className="mt-3 text-white/70">Sign in to your Sentinel workspace to access real-time anomaly detection, AI diagnostics, and executive reporting.</p>
        </div>
        <div className="relative text-xs text-white/60">SOC2-aligned · MFA-enforced · SSO ready</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to continue to Sentinel.</p>
          </div>

          <div className="space-y-3">
            <button type="button" onClick={() => quickSignIn(role)} className="w-full h-10 rounded-md border bg-card hover:bg-muted text-sm flex items-center justify-center gap-2">
              <Chrome className="size-4" /> Continue with Google
            </button>
            <button type="button" onClick={() => quickSignIn(role)} className="w-full h-10 rounded-md border bg-card hover:bg-muted text-sm flex items-center justify-center gap-2">
              <svg viewBox="0 0 23 23" className="size-4"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#7fba00" d="M12 1h10v10H12z"/><path fill="#00a4ef" d="M1 12h10v10H1z"/><path fill="#ffb900" d="M12 12h10v10H12z"/></svg>
              Continue with Microsoft
            </button>
            <button type="button" onClick={() => quickSignIn(role)} className="w-full h-10 rounded-md border bg-card hover:bg-muted text-sm flex items-center justify-center gap-2">
              SSO Login
            </button>
          </div>

          <div className="relative text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
            <span className="relative bg-background px-3 text-xs text-muted-foreground">or with email</span>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium">Email</span>
              <div className="mt-1 flex items-center border rounded-md bg-card focus-within:ring-2 focus-within:ring-accent/40">
                <Mail className="size-4 mx-3 text-muted-foreground" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 flex-1 bg-transparent outline-none text-sm pr-3" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium">Password</span>
              <div className="mt-1 flex items-center border rounded-md bg-card focus-within:ring-2 focus-within:ring-accent/40">
                <Lock className="size-4 mx-3 text-muted-foreground" />
                <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} className="h-10 flex-1 bg-transparent outline-none text-sm pr-3" />
              </div>
            </label>
            <div className="block">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-accent" /> Sign in as
              </span>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`text-left rounded-md border px-3 py-2 text-xs transition ${
                      role === r.value ? "border-accent bg-accent/10 ring-1 ring-accent/40" : "bg-card hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">{r.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{r.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-xs rounded-md border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2">
              {error}
            </div>
          )}

          <button type="submit" className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            Sign in
          </button>
          <p className="text-xs text-center text-muted-foreground">
            Demo mode · any credentials work. <Link to="/" className="underline">Back to home</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
