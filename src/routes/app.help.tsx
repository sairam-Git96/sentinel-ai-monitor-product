import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Pill } from "@/components/app-shell";
import { BookOpen, MessageCircle, LifeBuoy, Sparkles, Search, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/help")({
  head: () => ({ meta: [{ title: "Help Center · Sentinel AI" }] }),
  component: Page,
});

const FAQS = [
  { q: "What does Anomaly Score mean?", a: "A 0–100 measure of how far an observed metric deviates from its baseline, weighted by business impact. Scores above 80 are typically Critical." },
  { q: "How is the AI Assistant grounded?", a: "Each response is generated from a structured context payload built by the Context Engineering layer. The Grounding Badge indicates how strictly the response cites that payload." },
  { q: "Can I export reports as PDF?", a: "Yes — open Reports & Analytics, select a report card, and choose Export. PDF, CSV, and XLSX are supported." },
  { q: "How are roles enforced?", a: "Roles map to a permission set evaluated client-side for navigation and server-side for API access. Audit Logs record every role change." },
  { q: "Where are tooltips defined?", a: "All metric definitions live in src/lib/tooltips.ts. Hover the (i) icon anywhere in the platform to see definition, purpose, formula, and recommended action." },
  { q: "How do I add a new role?", a: "Open Role Management → New role. Assign permissions from the matrix view, then save. New roles immediately appear in the role switcher." },
];

const GUIDES = [
  { t: "Getting started",       b: "Sign in, choose a role, and tour the dashboard.", duration: "5 min" },
  { t: "Triage your first anomaly", b: "Use severity, confidence, and RCA to decide next steps.", duration: "8 min" },
  { t: "Run an investigation",  b: "Create a case, attach evidence, and close with a disposition.", duration: "12 min" },
  { t: "Tune detection rules",  b: "Reduce false positives without missing real fraud.", duration: "10 min" },
];

function Page() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => FAQS.filter((f) => !q || f.q.toLowerCase().includes(q.toLowerCase()) || f.a.toLowerCase().includes(q.toLowerCase())), [q]);

  return (
    <AppShell title="Help Center" subtitle="Documentation, FAQs, and support — everything you need to get unstuck.">
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: BookOpen,      t: "Documentation",  b: "Step-by-step guides for every module.",       cta: "Browse docs" },
          { icon: MessageCircle, t: "Contact support", b: "24/7 priority support for production issues.", cta: "Open ticket" },
          { icon: LifeBuoy,      t: "Status & uptime", b: "Live system status and incident history.",     cta: "View status" },
        ].map((c) => (
          <div key={c.t} className="rounded-xl border bg-card p-5">
            <div className="size-10 rounded-lg bg-accent/15 text-accent grid place-items-center"><c.icon className="size-5" /></div>
            <div className="text-sm font-semibold mt-3">{c.t}</div>
            <p className="text-xs text-muted-foreground mt-1">{c.b}</p>
            <button
              onClick={() => toast.message(c.t, { description: `${c.cta} (mock action).` })}
              className="mt-3 h-8 w-full rounded-md border text-xs hover:bg-muted inline-flex items-center justify-center gap-1"
            >{c.cta} <ChevronRight className="size-3" /></button>
          </div>
        ))}
      </div>

      <Tabs defaultValue="faqs">
        <TabsList>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="guides">Quick-start guides</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="faqs" className="mt-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-4 text-accent" /><h2 className="text-sm font-semibold">Frequently asked</h2>
              <div className="ml-auto relative">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search FAQs…" className="h-9 w-56 rounded-md border bg-background pl-8 pr-3 text-xs" />
              </div>
            </div>
            <ul className="divide-y">
              {filtered.map((f) => (
                <li key={f.q} className="py-3">
                  <div className="text-sm font-medium">{f.q}</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.a}</p>
                </li>
              ))}
              {filtered.length === 0 && <li className="py-6 text-center text-xs text-muted-foreground">No FAQs match your search.</li>}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="guides" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {GUIDES.map((g) => (
              <div key={g.t} className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{g.t}</div>
                  <Pill tone="info">{g.duration}</Pill>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{g.b}</p>
                <button onClick={() => toast.success(`Starting "${g.t}"`)} className="mt-3 h-8 w-full rounded-md border text-xs hover:bg-muted">Start guide</button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contact" className="mt-4">
          <form
            onSubmit={(e) => { e.preventDefault(); toast.success("Ticket submitted — we'll respond within 1 hour."); }}
            className="rounded-xl border bg-card p-5 max-w-2xl space-y-3"
          >
            <label className="block text-xs">
              <span className="text-muted-foreground">Subject</span>
              <input required className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs" />
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">Priority</span>
              <select className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs">
                <option>P1 — Production down</option>
                <option>P2 — Degraded</option>
                <option>P3 — Question</option>
              </select>
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">Describe the issue</span>
              <textarea required className="mt-1 min-h-28 w-full rounded-md border bg-background px-2 py-1.5 text-xs" />
            </label>
            <button type="submit" className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs">Submit ticket</button>
          </form>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
