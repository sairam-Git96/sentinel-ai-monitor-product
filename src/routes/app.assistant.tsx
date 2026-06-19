import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect, useMemo } from "react";
import { Bot, Send, Sparkles, User, Info } from "lucide-react";
import { AppShell, Pill, GroundingBadge } from "@/components/app-shell";
import {
  ASSISTANT_QA, generateAnomalies, buildAnomalyContext, buildSystemPrompt,
  classifyQueryGrounding, declineBreakdownFor, type Anomaly, type GroundingTier,
} from "@/lib/mock-data";

export const Route = createFileRoute("/app/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant · Sentinel AI" }] }),
  component: Assistant,
});

interface Msg {
  role: "user" | "assistant";
  content: string;
  ts: number;
  grounding?: GroundingTier;
  anomalyId?: string;
}

const MAX_TURNS = 10;

function groundedAnswer(q: string, a: Anomaly): { text: string; grounding: GroundingTier } {
  const ctx = buildAnomalyContext(a);
  const grounding = classifyQueryGrounding(q, ctx);
  const lower = q.toLowerCase();

  if (grounding === "insufficient") {
    return {
      text: "The available data does not provide enough information to answer this. The injected anomaly context covers metric, contributors, decline codes, and impact — but not forecasting, competitive, or external data.",
      grounding,
    };
  }

  // Decline code question
  if (lower.includes("decline") && (lower.includes("code") || lower.includes("reason") || lower.includes("drove") || lower.includes("driver"))) {
    const dec = declineBreakdownFor(a.id).slice(0, 3);
    return {
      text:
`**What happened**: ${a.metric} on **${ctx.metric}** moved from baseline **${ctx.baseline}** → observed **${ctx.observed}** (${ctx.deviation}).
**Where concentrated**: Top decline codes for ${a.id}:
${dec.map((d) => `- **${d.code}** ${d.label} — ${d.share}% share (${d.change > 0 ? "+" : ""}${d.change}% vs baseline)`).join("\n")}
**Probable cause**: ${dec[0].code === "R91" ? "Issuer authorization gateway timeouts (R91)" : `Elevated ${dec[0].label.toLowerCase()} events`} concentrated in **${a.country} / ${a.mcc}**.
**Recommended action**: Engage issuer ops on ${dec[0].code} failover, then validate next-day rate restoration.`,
      grounding,
    };
  }

  // Approval rate / why drop
  if (lower.includes("approval") || lower.includes("why") || lower.includes("drop") || lower.includes("fall")) {
    return {
      text:
`**What happened**: ${a.metric} for ${a.id} — baseline **${ctx.baseline}** → observed **${ctx.observed}** (${ctx.deviation}). Detected via **${ctx.detection_method}** within ${ctx.time_window}.
**Where concentrated**: ${ctx.top_contributors.map((c) => `${c.dimension}=${c.value} (${c.share})`).join(", ")}.
**Probable cause**: Top decline code **${ctx.top_decline_codes[0].code} — ${ctx.top_decline_codes[0].label}** at ${ctx.top_decline_codes[0].share} share (${ctx.top_decline_codes[0].change}).
**Recommended action**: ${a.recommendations[0] ?? "Engage issuer operations and lower step-up threshold for affected BIN range."} Estimated impact **${ctx.estimated_revenue_impact}** across **${ctx.impacted_transactions.toLocaleString()}** transactions.`,
      grounding,
    };
  }

  if (lower.includes("fraud")) {
    return {
      text:
`**What happened**: ${a.metric} — baseline **${ctx.baseline}** → observed **${ctx.observed}** (${ctx.deviation}).
**Where concentrated**: ${a.country} ${a.mcc} on ${a.channel} channel.
**Probable cause**: ${a.rootCauses[0]}.
**Recommended action**: ${a.recommendations[0]}. Estimated impact **${ctx.estimated_revenue_impact}**.`,
      grounding,
    };
  }

  if (lower.includes("impact") || lower.includes("loss")) {
    return {
      text: `Estimated revenue impact for **${a.id}** is **${ctx.estimated_revenue_impact}** across **${ctx.impacted_transactions.toLocaleString()}** affected transactions in ${a.country} / ${a.mcc} (${a.channel}).`,
      grounding,
    };
  }

  // fallback grounded
  const qa = ASSISTANT_QA.find((p) => lower.includes(p.q.toLowerCase().slice(0, 12)));
  if (qa) return { text: qa.a, grounding: "grounded" };
  return {
    text: `Based on anomaly **${a.id}** (${a.metric}): baseline ${ctx.baseline} → observed ${ctx.observed} (${ctx.deviation}). Detection: ${ctx.detection_method}. Impact: ${ctx.estimated_revenue_impact}. Ask me about decline codes, contributors, or recommended actions.`,
    grounding: "partial",
  };
}

function Assistant() {
  const anomalies = useMemo(() => generateAnomalies(25), []);
  const [active, setActive] = useState<Anomaly>(anomalies[0]);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      ts: Date.now(),
      grounding: "grounded",
      content: "Hi, I'm **Sentinel** — your grounded AI diagnostic assistant. I'm currently analyzing anomaly **ANM-1000** (Approval Rate Drop). Ask me anything about it — I only answer from the injected anomaly context.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m.slice(-MAX_TURNS * 2 + 1), { role: "user", content: text, ts: Date.now() }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const { text: ans, grounding } = groundedAnswer(text, active);
      setMessages((m) => [...m, { role: "assistant", content: ans, ts: Date.now(), grounding, anomalyId: active.id }]);
      setThinking(false);
    }, 700 + Math.random() * 500);
  };

  const switchAnomaly = (a: Anomaly) => {
    setActive(a);
    setMessages((m) => [...m, {
      role: "assistant", ts: Date.now(), grounding: "grounded",
      content: `Context switched to **${a.id}** — *${a.metric}* in ${a.country}/${a.mcc}. New anomaly context has been injected into the system prompt.`,
    }]);
  };

  return (
    <AppShell
      title="AI Diagnostic Assistant"
      subtitle="Grounded conversational analytics — every answer cites injected anomaly context."
      actions={<Pill tone="info"><Sparkles className="size-2.5" /> Grounded LLM · Online</Pill>}
    >
      <div className="grid lg:grid-cols-4 gap-4 h-[calc(100vh-260px)]">
        <aside className="rounded-xl border bg-card p-4 overflow-y-auto space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Anomaly Context</div>
            <select
              value={active.id}
              onChange={(e) => switchAnomaly(anomalies.find((a) => a.id === e.target.value)!)}
              className="w-full h-9 rounded-md border bg-background px-2 text-xs"
            >
              {anomalies.map((a) => <option key={a.id} value={a.id}>{a.id} · {a.metric}</option>)}
            </select>
            <div className="mt-2 rounded-md bg-muted/50 p-2.5 text-[11px] space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Metric</span><span className="font-medium">{active.metric}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Country/MCC</span><span className="font-medium">{active.country} · {active.mcc}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Confidence</span><span className="font-medium">{Math.round(active.confidence * 100)}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Turn cap</span><span className="font-medium">{MAX_TURNS}</span></div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Suggested Queries</div>
            <ul className="space-y-1.5">
              {[
                "Why did approval rate drop yesterday?",
                "Which decline reason codes drove this spike?",
                "What is the estimated revenue impact?",
                "Where is the fraud concentrated?",
                "Forecast next month's fraud rate",
              ].map((q) => (
                <li key={q}>
                  <button onClick={() => send(q)} className="w-full text-left text-xs px-3 py-2 rounded-md hover:bg-muted border border-transparent hover:border-border">
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Grounding Strategy</div>
            <div className="text-[11px] space-y-1">
              <div>• Structured JSON injected per anomaly</div>
              <div>• System prompt forbids speculation</div>
              <div>• History capped at {MAX_TURNS} turns</div>
              <div>• Model: Sentinel-GPT-4o</div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3 rounded-xl border bg-card flex flex-col min-h-0">
          <div className="px-5 py-3 border-b flex items-center gap-2">
            <div className="size-8 rounded-md gradient-brand grid place-items-center"><Bot className="size-4 text-white" /></div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Sentinel Assistant</div>
              <div className="text-[10px] text-muted-foreground">Grounded on <span className="font-mono">{active.id}</span> · {active.metric}</div>
            </div>
            <GroundingBadge tier="grounded" />
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.map((m, i) => <Bubble key={i} m={m} />)}
            {thinking && (
              <div className="flex items-start gap-3">
                <div className="size-7 rounded-full bg-accent/10 text-accent grid place-items-center"><Bot className="size-4" /></div>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                  <span className="inline-flex gap-1"><Dot /><Dot d=".15s" /><Dot d=".3s" /></span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t p-3 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${active.id}…`}
              className="flex-1 h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-accent/30"
            />
            <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 hover:opacity-90">
              <Send className="size-3.5" /> Send
            </button>
          </form>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground flex items-center gap-1.5">
        <Info className="size-3" />
        AI diagnostics are based on detected anomaly data only. Always validate with raw transaction data before taking action.
      </div>

      <div className="mt-2 rounded-lg border bg-card p-3 text-[11px] text-muted-foreground">
        <strong>Hallucination guard:</strong> Responses are restricted to the injected anomaly JSON. Queries outside scope (forecasting, external/competitive data) are refused with an "insufficient data" badge.
      </div>
    </AppShell>
  );
}

function Bubble({ m }: { m: Msg }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`size-7 rounded-full grid place-items-center shrink-0 ${isUser ? "bg-primary text-primary-foreground" : "bg-accent/10 text-accent"}`}>
        {isUser ? <User className="size-3.5" /> : <Bot className="size-4" />}
      </div>
      <div className={`max-w-[82%] space-y-1.5`}>
        <div className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        }`}>
          {renderMd(m.content)}
        </div>
        {!isUser && m.grounding && (
          <div className="flex items-center gap-2">
            <GroundingBadge tier={m.grounding} />
            {m.anomalyId && <span className="text-[10px] text-muted-foreground font-mono">ctx: {m.anomalyId}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function renderMd(text: string) {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <div key={li}>
        {parts.map((p, i) =>
          p.startsWith("**") && p.endsWith("**")
            ? <strong key={i}>{p.slice(2, -2)}</strong>
            : <span key={i}>{p}</span>
        )}
      </div>
    );
  });
}

function Dot({ d = "0s" }: { d?: string }) {
  return <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: d }} />;
}
