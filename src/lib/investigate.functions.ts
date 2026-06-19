import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InvestigateInput = z.object({
  id: z.string(),
  metric: z.string(),
  severity: z.string(),
  status: z.string(),
  country: z.string(),
  mcc: z.string(),
  channel: z.string(),
  impact: z.number(),
  affectedTxns: z.number(),
  confidence: z.number(),
  description: z.string(),
  rootCauses: z.array(z.string()),
  recommendations: z.array(z.string()),
});

const InvestigationSchema = z.object({
  verdict: z.enum(["clear", "needs_action", "inconclusive"]).describe(
    "clear = false positive or already mitigated, safe to close. needs_action = real issue, keep investigating. inconclusive = more data needed.",
  ),
  confidence: z.number().min(0).max(1).describe("Confidence in the verdict, 0-1."),
  summary: z.string().describe("One-paragraph executive summary of the investigation."),
  rootCause: z.string().describe("Most likely single root cause statement."),
  evidence: z.array(z.string()).min(2).max(6).describe("Concrete signals/data points supporting the verdict."),
  nextSteps: z.array(z.string()).min(2).max(5).describe("Specific actions an analyst should take next."),
  recommendedStatus: z.enum(["Resolved", "Investigating", "Escalated"]),
});

export type InvestigationResult = z.infer<typeof InvestigationSchema>;

export const investigateAnomaly = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InvestigateInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      throw new Error("LOVABLE_API_KEY is not configured.");
    }
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `You are a senior payments-risk investigator triaging an AI-detected anomaly for Sentinel AI.

Anomaly context:
- ID: ${data.id}
- Metric: ${data.metric}
- Current severity: ${data.severity}
- Current status: ${data.status}
- Country: ${data.country} · MCC: ${data.mcc} · Channel: ${data.channel}
- Impact: $${data.impact.toLocaleString()} across ${data.affectedTxns.toLocaleString()} transactions
- Model confidence: ${(data.confidence * 100).toFixed(0)}%
- Description: ${data.description}
- Candidate root causes: ${data.rootCauses.join("; ")}
- Prior recommendations: ${data.recommendations.join("; ")}

Investigate this anomaly. Decide whether it is clear (safe to close), still needs action, or is inconclusive.
Be specific to payments operations (issuer behavior, BIN ranges, 3DS, decline codes, network routing, fraud patterns).
Return a structured verdict with evidence and concrete next steps.`;

    try {
      const { experimental_output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt,
        experimental_output: Output.object({ schema: InvestigationSchema }),
      });
      return experimental_output;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Surface gateway-specific errors so the UI can react.
      if (/429/.test(message)) throw new Error("RATE_LIMITED");
      if (/402/.test(message)) throw new Error("CREDITS_EXHAUSTED");
      throw new Error(message);
    }
  });
