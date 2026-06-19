import { CalendarRange } from "lucide-react";

export type RangeDays = 30 | 60 | 90;

type Props = {
  value: RangeDays;
  onChange: (v: RangeDays) => void;
  className?: string;
};

const OPTIONS: RangeDays[] = [30, 60, 90];

/**
 * Segmented time-range filter (30 / 60 / 90 days).
 * Place in a module's action bar; parent owns state and re-slices data.
 */
export function RangeFilter({ value, onChange, className }: Props) {
  return (
    <div
      className={
        "inline-flex items-center gap-1 h-9 rounded-md border bg-background p-0.5 text-xs " +
        (className ?? "")
      }
      role="radiogroup"
      aria-label="Time range"
    >
      <span className="inline-flex items-center gap-1 px-2 text-muted-foreground">
        <CalendarRange className="size-3.5" />
      </span>
      {OPTIONS.map((d) => {
        const active = d === value;
        return (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(d)}
            className={
              "h-7 px-2.5 rounded-sm font-medium transition-colors " +
              (active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted")
            }
            title={`Show last ${d} days`}
          >
            {d}d
          </button>
        );
      })}
    </div>
  );
}
