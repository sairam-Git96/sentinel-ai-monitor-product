import { Download, RefreshCw, Printer } from "lucide-react";
import { toast } from "sonner";
import { downloadCSV } from "@/lib/export";

type Props = {
  /** Used in filename and toast copy. */
  module: string;
  /** Rows exported on CSV click. Pass [] to disable export. */
  rows?: ReadonlyArray<object>;
  /** Optional refresh callback. Defaults to a toast. */
  onRefresh?: () => void;
  /** Hide print button (defaults to true). */
  showPrint?: boolean;
};

/**
 * Standard module action bar: Export CSV, Refresh, Print PDF.
 * Drop into <AppShell actions={<ModuleActions ... />}>.
 */
export function ModuleActions({ module, rows, onRefresh, showPrint = true }: Props) {
  function handleExport() {
    if (!rows || rows.length === 0) {
      toast.info(`No ${module} rows available to export right now.`);
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const slug = module.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadCSV(rows, `sentinel-${slug}-${stamp}.csv`);
    toast.success(`${module} exported (${rows.length} rows).`);
  }

  function handleRefresh() {
    if (onRefresh) onRefresh();
    toast.success(`${module} refreshed.`);
  }

  function handlePrint() {
    toast.message("Opening print dialog…", { description: "Use 'Save as PDF' to download a report." });
    setTimeout(() => window.print(), 200);
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleRefresh}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border bg-background hover:bg-muted text-xs"
        title="Refresh data"
      >
        <RefreshCw className="size-3.5" /> Refresh
      </button>
      <button
        type="button"
        onClick={handleExport}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border bg-background hover:bg-muted text-xs"
        title="Export current view as CSV"
      >
        <Download className="size-3.5" /> Export CSV
      </button>
      {showPrint && (
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border bg-background hover:bg-muted text-xs"
          title="Print or save as PDF"
        >
          <Printer className="size-3.5" /> Print
        </button>
      )}
    </div>
  );
}
