import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Lovable AI Gateway provider for app-internal AI calls.
 * Reads LOVABLE_API_KEY from server env. Never import from client code.
 */
export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}
