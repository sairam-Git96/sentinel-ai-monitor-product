import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, ShieldCheck, AlertTriangle, HelpCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Pill } from "@/components/app-shell";
import { investigateAnomaly, type InvestigationResult } from "@/lib/investigate.functions";
import type { Anomaly, Status } from "@/lib/mock-data";
import { toast } from "sonner";

type Props = {
  anomaly: Anomaly | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onResolve: () => void;
  onKeepInvestigating: () => void;
  onEscalate: () => void;
};

type Phase = "idle" | "loading" | "ready" | "error";

const VERDICT_META: Record<InvestigationResult["verdict"], {
  label: string; tone: "success" | "warning" | "danger"; Icon: typeof ShieldCheck;
}> = {
  clear:         { label: "Clear — safe to close",      tone: "success", Icon: ShieldCheck },
  needs_action:  { label: "Needs action — keep open",   tone: "danger",  Icon: AlertTriangle },
  inconclusive:  { label: "Inconclusive — gather data", tone: "warning", Icon: HelpCircle },
};

export function InvestigateDialog({
  anomaly, open, onOpenChange, onResolve, onKeepInvestigating, onEscalate,
}: Props) {
  const runInvestigation = useServerFn(investigateAnomaly);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset whenever the dialog is opened for a new anomaly.
  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (next && anomaly) {
      void start(anomaly);
    } else if (!next) {
      setPhase("idle");
      setResult(null);
      setError(null);
    }
  }

  async function start(a: Anomaly) {
    setPhase("loading");
    setResult(null);
    setError(null);
    try {
      const res = await runInvestigation({
        data: {
          id: a.id,
          metric: a.metric,
          severity: a.severity,
          status: a.status,
          country: a.country,
          mcc: a.mcc,
          channel: a.channel,
          impact: a.impact,
          affectedTxns: a.affectedTxns,
          confidence: a.confidence,
          description: a.description,
          rootCauses: a.rootCauses,
          recommendations: a.recommendations,
        },
      });
      setResult(res as InvestigationResult);
      setPhase("ready");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const friendly =
        message === "RATE_LIMITED" ? "AI gateway is rate limited. Please retry in a moment." :
        message === "CREDITS_EXHAUSTED" ? "Workspace AI credits are exhausted. Add credits to continue." :
        message || "The investigation could not be completed.";
      setError(friendly);
      setPhase("error");
    }
  }

  function decide(status: Status) {
    if (!anomaly) return;
    if (status === "Resolved") {
      onResolve();
      toast.success(`${anomaly.id} closed as resolved.`);
    } else if (status === "Investigating") {
      onKeepInvestigating();
      toast.message(`${anomaly.id} remains under investigation.`);
    } else if (status === "Escalated") {
      onEscalate();
    }
    onOpenChange(false);
    setPhase("idle");
    setResult(null);
  }

  const meta = result ? VERDICT_META[result.verdict] : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="size-7 rounded-md bg-accent/10 text-accent grid place-items-center">
              <Sparkles className="size-4" />
            </span>
            AI Investigation · {anomaly?.id ?? ""}
          </DialogTitle>
          <DialogDescription>
            {anomaly ? `${anomaly.metric} — ${anomaly.country} · ${anomaly.mcc} · ${anomaly.channel}` : ""}
          </DialogDescription>
        </DialogHeader>

        {phase === "loading" && (
          <div className="py-10 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-accent" />
            <div>Investigating anomaly with Lovable AI…</div>
            <div className="text-xs">Correlating decline codes, issuer health, and historical patterns.</div>
          </div>
        )}

        {phase === "error" && (
          <div className="py-6 space-y-3">
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
              {error}
            </div>
            <button
              type="button"
              onClick={() => anomaly && start(anomaly)}
              className="h-9 px-3 rounded-md border text-xs font-medium hover:bg-muted"
            >Retry investigation</button>
          </div>
        )}

        {phase === "ready" && result && meta && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-2">
              <Pill tone={meta.tone}>
                <span className="inline-flex items-center gap-1.5">
                  <meta.Icon className="size-3" /> {meta.label}
                </span>
              </Pill>
              <span className="text-[11px] text-muted-foreground">
                AI confidence {Math.round(result.confidence * 100)}%
              </span>
            </div>

            <section>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Summary</div>
              <p className="text-sm leading-relaxed">{result.summary}</p>
            </section>

            <section>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Most likely root cause</div>
              <p className="text-sm leading-relaxed">{result.rootCause}</p>
            </section>

            <section>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Evidence</div>
              <ul className="space-y-1.5">
                {result.evidence.map((e, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="mt-1.5 size-1.5 rounded-full bg-accent shrink-0" />{e}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Recommended next steps</div>
              <ol className="space-y-1.5 list-decimal pl-4">
                {result.nextSteps.map((s, i) => (
                  <li key={i} className="text-xs leading-relaxed">{s}</li>
                ))}
              </ol>
            </section>
          </div>
        )}

        <DialogFooter>
          {phase === "ready" && result ? (
            <div className="flex w-full items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => anomaly && start(anomaly)}
                className="h-9 px-3 rounded-md border text-xs font-medium hover:bg-muted"
              >Re-run</button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => decide("Investigating")}
                  className="h-9 px-3 rounded-md border text-xs font-medium hover:bg-muted"
                >Keep investigating</button>
                <button
                  type="button"
                  onClick={() => decide("Escalated")}
                  className="h-9 px-3 rounded-md border border-destructive/40 text-destructive text-xs font-medium hover:bg-destructive/10"
                >Escalate</button>
                <button
                  type="button"
                  onClick={() => decide("Resolved")}
                  className={
                    "h-9 px-3 rounded-md text-xs font-medium " +
                    (result.verdict === "clear"
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "border hover:bg-muted")
                  }
                >Close as resolved</button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 px-3 rounded-md border text-xs"
            >Close</button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
