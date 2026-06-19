import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, ShieldCheck, Activity, Brain, BarChart3, Globe2,
  ArrowRight, Bot, CheckCircle2, Zap,
} from "lucide-react";
import heroImg from "@/assets/hero-dashboard.jpg";
import assistantImg from "@/assets/ai-assistant.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sentinel AI — AI-Powered Transaction Monitoring" },
      { name: "description", content: "Detect, diagnose, and resolve card transaction anomalies in real time with GenAI." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur bg-background/70 border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-md gradient-brand grid place-items-center">
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Sentinel AI</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Risk Intelligence</div>
            </div>
          </Link>
          <nav className="ml-10 hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#kpi" className="hover:text-foreground">Platform</a>
            <a href="#assistant" className="hover:text-foreground">AI Assistant</a>
            <a href="#testimonials" className="hover:text-foreground">Customers</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/login" className="text-sm px-3 py-1.5 rounded-md hover:bg-muted">Login</Link>
            <Link to="/login" className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 inline-flex items-center gap-1.5">
              Get Started <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 ring-grid pointer-events-none" />
        <div className="absolute -top-40 -right-40 size-[600px] rounded-full bg-accent/20 blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              Trusted by global card issuers · SOC2-aligned
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight">
              AI-Powered Transaction <br />
              <span className="text-gradient-brand">Monitoring & Diagnostics</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
              Sentinel AI monitors millions of card authorizations in real time, detects anomalies the moment they happen,
              and explains root cause in plain language — so Risk, Fraud, and Ops teams can act in seconds, not hours.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                Get Started <ArrowRight className="size-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 px-5 py-3 rounded-md border bg-card text-sm font-medium hover:bg-muted">
                Request Demo
              </Link>
            </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-accent/30 to-primary/30 blur-2xl rounded-3xl" />
              <img
                src={heroImg}
                alt="Sentinel AI transaction monitoring dashboard"
                width={1536}
                height={1024}
                className="relative rounded-2xl border shadow-2xl shadow-primary/20 w-full h-auto"
              />
            </div>
          </div>

          {/* hero preview card */}
          <div className="mt-14 relative rounded-xl border bg-card shadow-2xl shadow-primary/10 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/50">
              <span className="size-2.5 rounded-full bg-destructive/70" />
              <span className="size-2.5 rounded-full bg-warning/70" />
              <span className="size-2.5 rounded-full bg-success/70" />
              <span className="ml-3 text-xs text-muted-foreground">sentinel.ai / dashboard</span>
            </div>
            <div className="grid md:grid-cols-4 gap-4 p-5">
              {[
                { l: "Approval Rate", v: "94.7%", d: "+0.4%", ok: true },
                { l: "Decline Rate", v: "5.3%", d: "-0.4%", ok: true },
                { l: "Fraud Rate", v: "0.21%", d: "+0.05%", ok: false },
                { l: "Active Alerts", v: "27", d: "4 critical", ok: false },
              ].map((k) => (
                <div key={k.l} className="rounded-lg border p-4 bg-background">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.l}</div>
                  <div className="mt-1.5 text-2xl font-semibold tabular">{k.v}</div>
                  <div className={`mt-1 text-xs ${k.ok ? "text-success" : "text-destructive"}`}>{k.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-accent font-medium">Capabilities</div>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
            A complete monitoring & diagnostic platform for issuer operations.
          </h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {[
            { i: Activity, t: "Real-Time Monitoring", d: "Hourly aggregation across 65,000+ transaction signals with sub-second alerting." },
            { i: Brain, t: "AI Diagnostics", d: "GenAI explains why approval, decline, or fraud metrics shifted — in plain English." },
            { i: ShieldCheck, t: "Fraud Analytics", d: "BIN, MCC, country, and channel-level fraud surfaces with severity scoring." },
            { i: Zap, t: "Root Cause Analysis", d: "Automated driver attribution across merchant, network, issuer, and auth layers." },
            { i: BarChart3, t: "Executive Reporting", d: "10+ ready-to-share reports with PDF, Excel, CSV, and PPT export." },
            { i: Bot, t: "Conversational Analytics", d: "Ask Sentinel anything — anomalies, trends, comparisons, recommendations." },
          ].map((f) => (
            <div key={f.t} className="rounded-xl border bg-card p-6 hover:shadow-lg transition">
              <div className="size-10 rounded-md bg-accent/10 text-accent grid place-items-center">
                <f.i className="size-5" />
              </div>
              <div className="mt-4 font-semibold">{f.t}</div>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KPIs */}
      <section id="kpi" className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-8 text-center">
          {[
            ["50M+", "Transactions Processed"],
            ["99.9%", "Monitoring Accuracy"],
            ["500+", "Alerts Managed"],
            ["30+", "Countries Supported"],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="text-4xl md:text-5xl font-semibold tabular text-gradient-brand bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
                {v}
              </div>
              <div className="mt-2 text-sm text-primary-foreground/70">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Assistant preview */}
      <section id="assistant" className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="text-xs uppercase tracking-widest text-accent font-medium">AI Assistant</div>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">Ask Sentinel like a colleague.</h2>
          <img
            src={assistantImg}
            alt="AI fraud shield"
            width={1024}
            height={1024}
            loading="lazy"
            className="mt-6 rounded-xl border w-full max-w-sm"
          />
          <p className="mt-4 text-muted-foreground">
            Natural-language queries over your authorization data, fraud signals, and case history. Get explanations,
            comparisons, and recommended actions instantly.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {[
              "Why did approval rate fall yesterday?",
              "What caused the fraud spike in UK?",
              "Show top decline drivers and impact.",
              "Compare this month vs last month.",
            ].map((q) => (
              <li key={q} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" />{q}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border bg-card shadow-xl">
          <div className="border-b px-4 py-2.5 flex items-center gap-2">
            <Bot className="size-4 text-accent" />
            <span className="text-sm font-medium">Sentinel Assistant</span>
            <Pill>Online</Pill>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="max-w-[85%] ml-auto bg-accent text-accent-foreground rounded-lg rounded-tr-sm px-3 py-2">
              Why did approval rate fall yesterday?
            </div>
            <div className="max-w-[90%] bg-muted text-foreground rounded-lg rounded-tl-sm px-3 py-2">
              Approval rate fell from <strong>95.6% → 82.4%</strong>. Primary contributor: <strong>Travel MCC in USA</strong> —
              issuer timeout declines up <strong>370%</strong>. Estimated impact <strong>$2.1M</strong>. Confidence <strong>92%</strong>.
            </div>
            <div className="max-w-[90%] bg-muted text-foreground rounded-lg rounded-tl-sm px-3 py-2">
              Recommended: engage issuer ops, enable failover, and lower step-up threshold for affected BINs.
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-muted/50 border-y">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Trusted by risk and operations teams.</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              { n: "Sarah Thompson", r: "Head of Risk, Global Issuer", q: "Sentinel cut our mean-time-to-diagnose from 4 hours to 6 minutes. The AI explanations are board-ready." },
              { n: "William Harris", r: "VP Fraud Operations", q: "We finally have one screen that ties fraud, declines, and merchant performance together — with real attribution." },
              { n: "Olivia Martinez", r: "Operations Lead", q: "The conversational assistant has replaced our 11am triage call. Everyone gets the same answer, instantly." },
            ].map((t) => (
              <figure key={t.n} className="rounded-xl border bg-card p-6">
                <blockquote className="text-sm leading-relaxed">"{t.q}"</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <div className="size-9 rounded-full bg-accent/15 text-accent grid place-items-center text-xs font-semibold">
                    {t.n.split(" ").map((s) => s[0]).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t.n}</div>
                    <div className="text-xs text-muted-foreground">{t.r}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <Globe2 className="size-10 mx-auto text-accent" />
        <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">See Sentinel in your environment.</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Launch the live demo with realistic data across 5 countries, 6 MCCs, and 25 active anomalies.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/login" className="px-5 py-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 inline-flex items-center gap-2">
            Get Started <ArrowRight className="size-4" />
          </Link>
          <Link to="/login" className="px-5 py-3 rounded-md border bg-card text-sm font-medium hover:bg-muted">
            Request Demo
          </Link>
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-md gradient-brand grid place-items-center"><Sparkles className="size-3.5 text-white" /></div>
              <span className="font-semibold">Sentinel AI</span>
            </div>
            <p className="mt-3 text-muted-foreground text-xs">AI-powered transaction monitoring and diagnostics for card issuers.</p>
          </div>
          {[
            { h: "Product", l: ["Dashboard", "Anomalies", "AI Assistant", "Reports"] },
            { h: "Company", l: ["About", "Customers", "Contact", "Careers"] },
            { h: "Legal", l: ["Privacy Policy", "Terms", "Security", "Support"] },
          ].map((c) => (
            <div key={c.h}>
              <div className="font-medium">{c.h}</div>
              <ul className="mt-3 space-y-1.5 text-muted-foreground">
                {c.l.map((x) => <li key={x}><a className="hover:text-foreground" href="#">{x}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Sentinel AI · All rights reserved.</div>
      </footer>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full border bg-success/10 border-success/20 text-success px-2 py-0.5 text-[10px] font-medium">
    <span className="size-1.5 rounded-full bg-success" />{children}
  </span>;
}
