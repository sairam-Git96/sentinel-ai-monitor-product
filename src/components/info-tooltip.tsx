import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TOOLTIPS, type TooltipKey, type TooltipSpec } from "@/lib/tooltips";

type Props = {
  tip: TooltipKey | TooltipSpec;
  size?: "sm" | "md";
  className?: string;
};

export function InfoTooltip({ tip, size = "sm", className }: Props) {
  const spec: TooltipSpec = typeof tip === "string" ? TOOLTIPS[tip] : tip;
  const iconSize = size === "sm" ? "size-3.5" : "size-4";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Info: ${spec.title}`}
          className={
            "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 " +
            (className ?? "")
          }
        >
          <Info className={iconSize} />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="center" className="w-80 p-0 text-xs">
        <div className="border-b px-3 py-2">
          <div className="text-sm font-semibold">{spec.title}</div>
        </div>
        <div className="p-3 space-y-2.5 leading-relaxed">
          <Row label="Definition" value={spec.definition} />
          <Row label="Purpose" value={spec.purpose} />
          {spec.usage && <Row label="How to use" value={spec.usage} />}
          {spec.formula && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Formula</div>
              <code className="mt-0.5 block rounded bg-muted px-2 py-1 font-mono text-[11px]">{spec.formula}</code>
            </div>
          )}
          {spec.example && <Row label="Example" value={spec.example} />}
          {spec.impact && <Row label="Business impact" value={spec.impact} />}
          {spec.action && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-accent">Recommended action</div>
              <div className="mt-0.5 text-foreground">{spec.action}</div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-foreground">{value}</div>
    </div>
  );
}
