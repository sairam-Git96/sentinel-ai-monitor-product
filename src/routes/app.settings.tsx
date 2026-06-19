import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Pill } from "@/components/app-shell";
import { Bell, Globe, Palette, ShieldCheck, KeyRound, Save } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings · Sentinel AI" }] }),
  component: Page,
});

function Toggle({ label, hint, defaultOn = false, onChange }: { label: string; hint: string; defaultOn?: boolean; onChange?: (on: boolean) => void }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <label className="flex items-start justify-between gap-4 py-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <button
        type="button"
        onClick={() => { const next = !on; setOn(next); onChange?.(next); }}
        aria-pressed={on}
        className={"relative h-5 w-9 rounded-full transition shrink-0 " + (on ? "bg-accent" : "bg-muted")}
      >
        <span className={"absolute top-0.5 size-4 rounded-full bg-white shadow transition " + (on ? "left-4" : "left-0.5")} />
      </button>
    </label>
  );
}

function Page() {
  function save() { toast.success("Settings saved."); }

  return (
    <AppShell
      title="Settings"
      subtitle="System preferences, notifications, security, and integrations."
      actions={
        <button onClick={save} className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5">
          <Save className="size-3.5" /> Save changes
        </button>
      }
    >
      <Tabs defaultValue="appearance">
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="localization">Localization</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="mt-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-2"><Palette className="size-4 text-accent" /><h2 className="text-sm font-semibold">Appearance</h2></div>
            <Toggle label="Compact density" hint="Reduce table row height and padding." defaultOn />
            <Toggle label="High-contrast mode" hint="Improve readability for accessibility." />
            <Toggle label="Reduced motion" hint="Disable non-essential animations." />
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-2"><Bell className="size-4 text-accent" /><h2 className="text-sm font-semibold">Notifications</h2></div>
            <Toggle label="Critical anomaly alerts" hint="Email + in-app notifications for Critical severity." defaultOn />
            <Toggle label="Weekly executive digest" hint="Sent every Monday 8:00 local time." defaultOn />
            <Toggle label="Case assignment" hint="Notify me when a case is assigned to me." defaultOn />
            <Toggle label="Slack mirror" hint="Mirror critical alerts to #risk-alerts." />
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-2"><ShieldCheck className="size-4 text-accent" /><h2 className="text-sm font-semibold">Security</h2></div>
            <Toggle label="Multi-factor authentication" hint="Required for all Admin and Investigator roles." defaultOn />
            <Toggle label="Session inactivity lock" hint="Lock the workspace after 15 minutes idle." defaultOn />
            <Toggle label="IP allow list" hint="Restrict admin actions to approved CIDR ranges." />
            <div className="mt-3 flex items-center gap-2">
              <Pill tone="success"><ShieldCheck className="size-3" /> SOC2 Type II</Pill>
              <Pill tone="info"><KeyRound className="size-3" /> SSO enabled</Pill>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="localization" className="mt-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-3"><Globe className="size-4 text-accent" /><h2 className="text-sm font-semibold">Localization</h2></div>
            <label className="block text-xs">
              <span className="text-muted-foreground">Timezone</span>
              <select className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs">
                <option>America/New_York (UTC-5)</option>
                <option>Europe/London (UTC+0)</option>
                <option>Asia/Singapore (UTC+8)</option>
              </select>
            </label>
            <label className="block text-xs mt-3">
              <span className="text-muted-foreground">Currency</span>
              <select className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs">
                <option>USD — US Dollar</option>
                <option>EUR — Euro</option>
                <option>GBP — Pound Sterling</option>
              </select>
            </label>
            <label className="block text-xs mt-3">
              <span className="text-muted-foreground">Date format</span>
              <select className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs">
                <option>YYYY-MM-DD (ISO)</option>
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
              </select>
            </label>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: "Slack",      desc: "Push critical alerts to a channel.", status: "Connected" },
              { name: "PagerDuty",  desc: "Page on-call for P1 incidents.",     status: "Connected" },
              { name: "Snowflake",  desc: "Stream investigations to the warehouse.", status: "Disconnected" },
              { name: "Jira",       desc: "Create tickets from incidents.",     status: "Disconnected" },
            ].map((i) => (
              <div key={i.name} className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{i.name}</div>
                  <Pill tone={i.status === "Connected" ? "success" : "neutral"}>{i.status}</Pill>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{i.desc}</p>
                <button
                  onClick={() => toast.success(`${i.name} ${i.status === "Connected" ? "disconnected" : "connected"}.`)}
                  className="mt-3 h-8 w-full rounded-md border text-xs hover:bg-muted"
                >{i.status === "Connected" ? "Disconnect" : "Connect"}</button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
