import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Database, Layers, Brain, ShieldCheck, ArrowRight, Cpu, Lock, FileCode2,
  Globe, Users, Server, Cloud, GitBranch, Zap, Workflow, Network as NetIcon,
  Download, ZoomIn, ZoomOut, RotateCcw,
} from "lucide-react";
import { AppShell, Pill } from "@/components/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/app/architecture")({
  head: () => ({ meta: [{ title: "System Architecture · Sentinel AI" }] }),
  component: Architecture,
});

const TABS = [
  { id: "overview",    label: "Solution Overview" },
  { id: "layers",      label: "Application Layers" },
  { id: "access",      label: "User Access Flow" },
  { id: "dataflow",    label: "Data Flow" },
  { id: "txn",         label: "Transaction Processing" },
  { id: "ai",          label: "AI Detection Engine" },
  { id: "rca",         label: "RCA Flow" },
  { id: "er",          label: "Database ER" },
  { id: "api",         label: "API Architecture" },
  { id: "security",    label: "Security" },
  { id: "deploy",      label: "Deployment" },
  { id: "scale",       label: "Future Scalability" },
] as const;

function Architecture() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");
  return (
    <AppShell
      title="System Architecture"
      subtitle="Solution, data, AI, security, and deployment architecture for the Sentinel platform."
      actions={<Pill tone="info">Reference Architecture</Pill>}
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
        <TabsList className="flex flex-wrap h-auto p-1 bg-muted/60">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview"><Overview /></TabsContent>
        <TabsContent value="layers"><LayersTab /></TabsContent>
        <TabsContent value="access"><AccessFlow /></TabsContent>
        <TabsContent value="dataflow"><DataFlow /></TabsContent>
        <TabsContent value="txn"><TxnFlow /></TabsContent>
        <TabsContent value="ai"><AIEngine /></TabsContent>
        <TabsContent value="rca"><RcaFlow /></TabsContent>
        <TabsContent value="er"><ErDiagram /></TabsContent>
        <TabsContent value="api"><ApiArch /></TabsContent>
        <TabsContent value="security"><Security /></TabsContent>
        <TabsContent value="deploy"><Deployment /></TabsContent>
        <TabsContent value="scale"><Scalability /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

/* ---------- Diagram shell with zoom + export ---------- */

function DiagramFrame({
  title, description, children, exportName,
}: { title: string; description: string; children: React.ReactNode; exportName: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  function exportSvg() {
    const svg = ref.current?.querySelector("svg");
    if (!svg) {
      toast.error("Nothing to export on this diagram.");
      return;
    }
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${exportName}.svg`);
  }

  return (
    <section className="mt-4 rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-3xl">{description}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="h-8 w-8 grid place-items-center rounded-md border bg-background hover:bg-muted" aria-label="Zoom out"><ZoomOut className="size-3.5" /></button>
          <span className="text-[11px] w-12 text-center tabular text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2, z + 0.1))} className="h-8 w-8 grid place-items-center rounded-md border bg-background hover:bg-muted" aria-label="Zoom in"><ZoomIn className="size-3.5" /></button>
          <button onClick={() => setZoom(1)} className="h-8 w-8 grid place-items-center rounded-md border bg-background hover:bg-muted" aria-label="Reset zoom"><RotateCcw className="size-3.5" /></button>
          <button onClick={exportSvg} className="ml-1 h-8 px-2.5 rounded-md border bg-background hover:bg-muted text-xs inline-flex items-center gap-1.5"><Download className="size-3.5" /> Export</button>
        </div>
      </div>
      <div className="p-5 overflow-auto bg-muted/20">
        <div ref={ref} style={{ transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform 120ms" }}>
          {children}
        </div>
      </div>
    </section>
  );
}

function Node({ icon: Icon, label, hint, tone = "accent" }: { icon: React.ComponentType<{ className?: string }>; label: string; hint?: string; tone?: "accent" | "success" | "warning" | "danger" }) {
  const colorMap = {
    accent: "bg-accent/10 text-accent border-accent/30",
    success: "bg-success/10 text-success border-success/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    danger: "bg-destructive/10 text-destructive border-destructive/30",
  } as const;
  return (
    <div className="group rounded-lg border bg-background p-3 hover:shadow-md transition" title={hint}>
      <div className={"size-8 rounded-md grid place-items-center border " + colorMap[tone]}>
        <Icon className="size-4" />
      </div>
      <div className="mt-2 text-xs font-semibold">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{hint}</div>}
    </div>
  );
}

function FlowArrow() {
  return <ArrowRight className="hidden md:block size-4 text-muted-foreground shrink-0" />;
}

function CardGrid({ items }: { items: { title: string; body: string }[] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
      {items.map((it) => (
        <div key={it.title} className="rounded-lg border bg-card p-4">
          <div className="text-sm font-semibold">{it.title}</div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{it.body}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------- Tabs ---------- */

function Overview() {
  return (
    <>
      <DiagramFrame
        title="High-Level Solution Architecture"
        description="End-to-end view of the Sentinel platform — from card-issuer transaction sources through detection, intelligence, and the analyst experience."
        exportName="sentinel-solution-overview"
      >
        <svg viewBox="0 0 900 320" className="w-full max-w-[900px] h-auto">
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 Z" fill="currentColor" />
            </marker>
          </defs>
          {[
            { x: 40, y: 130, w: 130, h: 60, label: "Issuer Hosts", sub: "VisaNet / MasterCom" },
            { x: 220, y: 130, w: 130, h: 60, label: "Ingestion", sub: "Kafka · 65k/s" },
            { x: 400, y: 60, w: 130, h: 60, label: "Detection Engine", sub: "Z-Score · IF · Prophet" },
            { x: 400, y: 210, w: 130, h: 60, label: "Storage Lake", sub: "Postgres + S3" },
            { x: 580, y: 130, w: 130, h: 60, label: "AI Layer", sub: "LLM grounding" },
            { x: 760, y: 130, w: 120, h: 60, label: "Analyst UI", sub: "React SPA" },
          ].map((n) => (
            <g key={n.label}>
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={8} className="fill-card stroke-border" strokeWidth={1.5} />
              <text x={n.x + n.w / 2} y={n.y + 25} textAnchor="middle" className="fill-foreground" fontSize={12} fontWeight={600}>{n.label}</text>
              <text x={n.x + n.w / 2} y={n.y + 44} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>{n.sub}</text>
            </g>
          ))}
          <g className="text-muted-foreground" stroke="currentColor" strokeWidth={1.5} fill="none">
            <line x1={170} y1={160} x2={220} y2={160} markerEnd="url(#arr)" />
            <line x1={350} y1={150} x2={400} y2={100} markerEnd="url(#arr)" />
            <line x1={350} y1={170} x2={400} y2={230} markerEnd="url(#arr)" />
            <line x1={530} y1={90} x2={580} y2={150} markerEnd="url(#arr)" />
            <line x1={530} y1={240} x2={580} y2={170} markerEnd="url(#arr)" />
            <line x1={710} y1={160} x2={760} y2={160} markerEnd="url(#arr)" />
          </g>
        </svg>
      </DiagramFrame>

      <CardGrid items={[
        { title: "Frontend", body: "TanStack Start + React 19 SPA with shadcn/ui. Server-side rendered routes for fast first paint, fully reactive analyst experience." },
        { title: "Backend", body: "Node service workers on edge runtime. Server functions expose typed RPC and ingest webhook routes for issuer feeds." },
        { title: "Database", body: "Postgres for transactional + case data, columnar lake (Parquet on S3) for high-volume transaction history and ML feature store." },
        { title: "AI / ML", body: "Detection ensemble (Z-Score, Isolation Forest, Prophet, Moving Average) + grounded LLM diagnostic layer with strict context injection." },
        { title: "Data Flow", body: "Streaming ingestion → aggregation → detection → context builder → analyst UI. All paths are auditable and replayable." },
        { title: "Security", body: "OIDC SSO, role-based access, encryption in transit (TLS 1.3) and at rest (KMS), full audit trail of every action." },
      ]} />
    </>
  );
}

function LayersTab() {
  return (
    <DiagramFrame title="Application Layers" description="Logical layers from presentation to data, with the cross-cutting concerns that span them." exportName="sentinel-layers">
      <svg viewBox="0 0 800 360" className="w-full max-w-[800px] h-auto">
        {[
          { y: 20, label: "Presentation Layer", sub: "TanStack Router · React · shadcn/ui · Recharts", color: "rgba(37,99,235,0.10)" },
          { y: 80, label: "Application Layer", sub: "Server functions · Role guards · Workflow orchestration", color: "rgba(34,197,94,0.10)" },
          { y: 140, label: "Domain Layer", sub: "Anomaly · Case · Incident · Audit aggregates", color: "rgba(245,158,11,0.10)" },
          { y: 200, label: "Detection & AI Layer", sub: "Statistical models · Isolation Forest · Prophet · LLM grounding", color: "rgba(139,92,246,0.10)" },
          { y: 260, label: "Data & Integration Layer", sub: "Postgres · S3 · Kafka · External issuer APIs", color: "rgba(239,68,68,0.10)" },
        ].map((l) => (
          <g key={l.label}>
            <rect x={20} y={l.y} width={620} height={50} rx={8} fill={l.color} className="stroke-border" />
            <text x={36} y={l.y + 22} className="fill-foreground" fontSize={13} fontWeight={600}>{l.label}</text>
            <text x={36} y={l.y + 40} className="fill-muted-foreground" fontSize={11}>{l.sub}</text>
          </g>
        ))}
        <rect x={660} y={20} width={120} height={290} rx={8} className="fill-muted stroke-border" />
        <text x={720} y={45} textAnchor="middle" className="fill-foreground" fontSize={12} fontWeight={600}>Cross-cutting</text>
        {["Security","Observability","Audit","Caching","Telemetry","Feature Flags"].map((t, i) => (
          <text key={t} x={720} y={75 + i * 36} textAnchor="middle" className="fill-muted-foreground" fontSize={11}>{t}</text>
        ))}
      </svg>
    </DiagramFrame>
  );
}

function AccessFlow() {
  return (
    <DiagramFrame title="User Access Flow" description="From browser to authenticated session — OIDC SSO, role resolution, and permission gates." exportName="sentinel-access-flow">
      <div className="flex flex-wrap items-center gap-3">
        <Node icon={Globe} label="Browser" hint="User opens app.sentinel.ai" />
        <FlowArrow />
        <Node icon={ShieldCheck} label="Edge Auth" hint="OIDC redirect to IdP" />
        <FlowArrow />
        <Node icon={Users} label="IdP / SSO" hint="Okta · Azure AD · Google" tone="success" />
        <FlowArrow />
        <Node icon={Lock} label="Token Exchange" hint="JWT + refresh, RS256" tone="warning" />
        <FlowArrow />
        <Node icon={Layers} label="Session Service" hint="Resolves role + permissions" />
        <FlowArrow />
        <Node icon={Cpu} label="App Shell" hint="Renders role-aware nav" tone="accent" />
      </div>
    </DiagramFrame>
  );
}

function DataFlow() {
  return (
    <DiagramFrame title="Data Flow Diagram" description="Streaming, batch, and ad-hoc analyst paths through the platform." exportName="sentinel-data-flow">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Node icon={Database} label="Issuer Feed" hint="ISO 8583 messages" />
          <FlowArrow />
          <Node icon={Zap} label="Kafka" hint="65k msg/sec" tone="warning" />
          <FlowArrow />
          <Node icon={Layers} label="Stream Aggregator" hint="Country × MCC × channel × BIN" />
          <FlowArrow />
          <Node icon={Cpu} label="Detector" hint="Online + batch" tone="accent" />
          <FlowArrow />
          <Node icon={FileCode2} label="Context Builder" hint="Grounded JSON payload" />
          <FlowArrow />
          <Node icon={Brain} label="LLM" hint="Sentinel-GPT-4o" tone="success" />
          <FlowArrow />
          <Node icon={Users} label="Analyst UI" />
        </div>
        <div className="text-xs text-muted-foreground border-l-2 border-accent/40 pl-3">
          Side paths: detection results write to <strong>Postgres</strong> (cases, audit), and raw aggregations write to <strong>S3 Parquet</strong> for offline retraining and BI.
        </div>
      </div>
    </DiagramFrame>
  );
}

function TxnFlow() {
  return (
    <DiagramFrame title="Transaction Processing Flow" description="Per-transaction lifecycle from issuer to settlement, with risk decision points." exportName="sentinel-txn-flow">
      <div className="grid md:grid-cols-7 gap-3 items-stretch">
        <Node icon={Globe} label="Cardholder" hint="Tap / swipe / online" />
        <FlowArrow />
        <Node icon={Server} label="Acquirer" hint="Merchant bank" />
        <FlowArrow />
        <Node icon={NetIcon} label="Card Network" hint="Visa · Mastercard" tone="warning" />
        <FlowArrow />
        <Node icon={ShieldCheck} label="Issuer Auth" hint="Approve / Decline" tone="accent" />
      </div>
      <div className="grid md:grid-cols-7 gap-3 items-stretch mt-3">
        <Node icon={Cpu} label="Risk Engine" hint="Velocity + ML" tone="danger" />
        <FlowArrow />
        <Node icon={Layers} label="Decision" hint="Approve · Step-up · Decline" />
        <FlowArrow />
        <Node icon={Database} label="Authorization Log" hint="Postgres + S3" />
        <FlowArrow />
        <Node icon={Workflow} label="Clearing & Settlement" hint="T+1 batch" tone="success" />
      </div>
    </DiagramFrame>
  );
}

function AIEngine() {
  return (
    <DiagramFrame title="AI Detection Engine" description="Ensemble of statistical and ML methods, with grounded LLM diagnostics on top." exportName="sentinel-ai-engine">
      <div className="grid md:grid-cols-4 gap-3">
        {[
          { m: "Z-Score", w: "Approval rate, decline rate (stable baselines)", t: "accent" as const },
          { m: "Isolation Forest", w: "Fraud (sparse, high-dim BIN × MCC × geo)", t: "danger" as const },
          { m: "Prophet", w: "Volume (weekly seasonality)", t: "warning" as const },
          { m: "Moving Average", w: "Decline spikes (trending baseline)", t: "success" as const },
        ].map((x) => (
          <Node key={x.m} icon={Cpu} label={x.m} hint={x.w} tone={x.t} />
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Node icon={Layers} label="Method Router" hint="Picks method per metric class" />
        <FlowArrow />
        <Node icon={FileCode2} label="Context Builder" hint="Structured JSON with baseline, observed, deviation, contributors" />
        <FlowArrow />
        <Node icon={Brain} label="LLM" hint="Strict grounding · refuses unsupported queries" tone="success" />
        <FlowArrow />
        <Node icon={ShieldCheck} label="Confidence Tier" hint="Grounded / Partial / Insufficient" />
      </div>
    </DiagramFrame>
  );
}

function RcaFlow() {
  return (
    <DiagramFrame title="Root Cause Analysis Flow" description="From anomaly to ranked contributing factors and recommended remediation." exportName="sentinel-rca-flow">
      <div className="flex flex-wrap items-center gap-3">
        <Node icon={AlertOctagonIcon} label="Anomaly Detected" tone="danger" />
        <FlowArrow />
        <Node icon={Layers} label="Dimension Drill" hint="Country / MCC / BIN / Channel" />
        <FlowArrow />
        <Node icon={Cpu} label="Contribution Scoring" hint="Δ vs baseline per dim" />
        <FlowArrow />
        <Node icon={Brain} label="LLM Hypothesis" hint="Top 3 probable causes" tone="accent" />
        <FlowArrow />
        <Node icon={ShieldCheck} label="Recommended Actions" hint="Issuer escalation · rule tuning · merchant review" tone="success" />
      </div>
    </DiagramFrame>
  );
}

function AlertOctagonIcon(props: { className?: string }) {
  // small inline alias to keep icon imports tidy
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}

function ErDiagram() {
  return (
    <DiagramFrame title="Database Entity Relationships" description="Core entities and relationships powering anomalies, cases, and audit." exportName="sentinel-er">
      <svg viewBox="0 0 820 360" className="w-full max-w-[820px] h-auto">
        {[
          { x: 30, y: 30, w: 180, h: 130, t: "transactions", fields: ["id PK", "ts", "amount", "mcc", "country", "bin", "status"] },
          { x: 250, y: 30, w: 180, h: 130, t: "anomalies", fields: ["id PK", "metric", "severity", "ts", "confidence", "status"] },
          { x: 470, y: 30, w: 180, h: 130, t: "investigations", fields: ["id PK", "anomaly_id FK", "assignee", "priority", "status"] },
          { x: 30, y: 200, w: 180, h: 130, t: "users", fields: ["id PK", "email", "role", "last_login"] },
          { x: 250, y: 200, w: 180, h: 130, t: "roles", fields: ["id PK", "name", "permissions[]"] },
          { x: 470, y: 200, w: 180, h: 130, t: "audit_log", fields: ["id PK", "user_id FK", "action", "target", "ts"] },
        ].map((e) => (
          <g key={e.t}>
            <rect x={e.x} y={e.y} width={e.w} height={e.h} rx={6} className="fill-card stroke-accent/60" strokeWidth={1.5} />
            <rect x={e.x} y={e.y} width={e.w} height={22} rx={6} className="fill-accent/15" />
            <text x={e.x + 10} y={e.y + 15} className="fill-foreground" fontSize={12} fontWeight={700}>{e.t}</text>
            {e.fields.map((f, i) => (
              <text key={f} x={e.x + 10} y={e.y + 38 + i * 14} className="fill-muted-foreground" fontSize={10}>{f}</text>
            ))}
          </g>
        ))}
        <g className="text-accent" stroke="currentColor" strokeWidth={1.5} fill="none">
          <line x1={210} y1={90} x2={250} y2={90} />
          <line x1={430} y1={90} x2={470} y2={90} />
          <line x1={210} y1={260} x2={250} y2={260} />
          <line x1={120} y1={200} x2={120} y2={160} />
          <line x1={560} y1={200} x2={120} y2={200} strokeDasharray="3 3" opacity={0.4} />
        </g>
      </svg>
    </DiagramFrame>
  );
}

function ApiArch() {
  return (
    <DiagramFrame title="API Architecture" description="Typed server functions (RPC) for app-internal calls; public REST + webhooks under /api/public/* for external systems." exportName="sentinel-api">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-background p-4">
          <div className="text-sm font-semibold flex items-center gap-2"><FileCode2 className="size-4 text-accent" /> Internal (RPC)</div>
          <ul className="mt-3 space-y-1.5 text-xs font-mono text-muted-foreground">
            <li>getAnomalies()</li>
            <li>getAnomalyContext(id)</li>
            <li>assignInvestigation(caseId, userId)</li>
            <li>generateAIInsight(anomalyId)</li>
            <li>exportReport(reportId, format)</li>
          </ul>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <div className="text-sm font-semibold flex items-center gap-2"><Globe className="size-4 text-success" /> Public REST</div>
          <ul className="mt-3 space-y-1.5 text-xs font-mono text-muted-foreground">
            <li>POST /api/public/ingest/transactions</li>
            <li>POST /api/public/webhooks/issuer-callback</li>
            <li>GET  /api/public/health</li>
            <li>GET  /api/public/anomalies (signed)</li>
          </ul>
        </div>
      </div>
    </DiagramFrame>
  );
}

function Security() {
  return (
    <DiagramFrame title="Security Architecture" description="Defense-in-depth from edge to data, with auditability at every layer." exportName="sentinel-security">
      <CardGrid items={[
        { title: "Identity", body: "OIDC SSO with MFA enforcement. Just-in-time provisioning, automatic deprovisioning via SCIM." },
        { title: "Authorization", body: "Role-based access control with attribute-based overrides per region. Permissions evaluated server-side on every request." },
        { title: "Transport", body: "TLS 1.3 everywhere. HSTS preload. mTLS between internal services." },
        { title: "Data at Rest", body: "AES-256 with KMS-managed keys. Per-tenant key isolation. Row-level encryption for PCI fields." },
        { title: "Secret Management", body: "Vault-backed secrets. No secrets in code or images. Short-lived dynamic credentials for databases." },
        { title: "Audit Trail", body: "Immutable append-only audit log of every action with user, time, and target. Streamed to SIEM in real time." },
        { title: "Compliance", body: "PCI-DSS Level 1, SOC 2 Type II, ISO 27001. Quarterly penetration tests and annual third-party audits." },
        { title: "Detection", body: "Anomalous access detection, brute-force lockout, geo-velocity controls on the admin surface." },
        { title: "Privacy", body: "PII tokenization. Data residency controls per region. Right-to-be-forgotten workflow." },
      ]} />
    </DiagramFrame>
  );
}

function Deployment() {
  return (
    <DiagramFrame title="Deployment Architecture" description="Multi-region, multi-AZ active-active topology with blue/green release strategy." exportName="sentinel-deploy">
      <svg viewBox="0 0 820 280" className="w-full max-w-[820px] h-auto">
        <rect x={20} y={20} width={380} height={240} rx={10} className="fill-card stroke-accent/40" strokeWidth={1.5} />
        <text x={40} y={45} className="fill-foreground" fontSize={13} fontWeight={700}>Region: us-east-1 (Primary)</text>
        <rect x={420} y={20} width={380} height={240} rx={10} className="fill-card stroke-warning/40" strokeWidth={1.5} />
        <text x={440} y={45} className="fill-foreground" fontSize={13} fontWeight={700}>Region: eu-west-1 (Active DR)</text>
        {[20, 420].map((rx) => (
          <g key={rx}>
            {["AZ-a", "AZ-b", "AZ-c"].map((az, i) => (
              <g key={az}>
                <rect x={rx + 20} y={70 + i * 60} width={340} height={50} rx={6} className="fill-muted stroke-border" />
                <text x={rx + 35} y={92 + i * 60} className="fill-foreground" fontSize={11} fontWeight={600}>{az}</text>
                <text x={rx + 90} y={92 + i * 60} className="fill-muted-foreground" fontSize={10}>API · Detection workers · Postgres replica</text>
              </g>
            ))}
          </g>
        ))}
      </svg>
      <CardGrid items={[
        { title: "Edge", body: "Cloudflare Workers run the SSR layer and API at the edge in 300+ POPs." },
        { title: "Compute", body: "Auto-scaling worker pools for detection (CPU) and ML inference (GPU)." },
        { title: "CI/CD", body: "GitHub Actions → blue/green deploy → progressive rollout with automated rollback on SLO breach." },
      ]} />
    </DiagramFrame>
  );
}

function Scalability() {
  return (
    <DiagramFrame title="Future Scalability Architecture" description="Where the platform is headed: horizontal sharding, ML feature store, real-time graph." exportName="sentinel-scale">
      <CardGrid items={[
        { title: "Horizontal Sharding", body: "Partition transactions and anomalies by region + tenant; route via consistent hashing for sub-100ms reads at 10× volume." },
        { title: "ML Feature Store", body: "Centralized online + offline feature store (Feast) for sub-millisecond inference and consistent training/serving features." },
        { title: "Streaming Graph", body: "Real-time entity graph (cards → merchants → BINs → devices) for cross-entity fraud rings and link analysis." },
        { title: "Vector RAG", body: "Long-term memory of past investigations indexed in a vector store for instant analogous-case retrieval." },
        { title: "Multi-Cloud", body: "Workload mobility across AWS, GCP, Azure via Kubernetes + Crossplane for regulatory or cost optimization." },
        { title: "Edge Inference", body: "On-card-network edge inference for sub-50ms fraud scoring before authorization decisions reach the issuer." },
      ]} />
      <div className="mt-4 flex flex-wrap items-center gap-3 px-1">
        <Node icon={GitBranch} label="Today" hint="Single region, monolithic detector" />
        <FlowArrow />
        <Node icon={Cloud} label="Q1" hint="Multi-region active-active" tone="accent" />
        <FlowArrow />
        <Node icon={Cpu} label="Q2" hint="Feature store + vector RAG" tone="warning" />
        <FlowArrow />
        <Node icon={Brain} label="Q3" hint="Edge inference + graph" tone="success" />
      </div>
    </DiagramFrame>
  );
}
