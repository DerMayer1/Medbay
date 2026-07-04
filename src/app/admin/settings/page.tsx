import { Activity, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const dynamic = "force-dynamic";

type ProviderStatus = {
  name: string;
  description: string;
  configured: boolean;
  required: string[];
  missing: string[];
};

function hasEnv(name: string) {
  return Boolean(process.env[name]);
}

function providerStatus(name: string, description: string, required: string[]): ProviderStatus {
  const missing = required.filter((key) => !hasEnv(key));
  return {
    name,
    description,
    configured: missing.length === 0,
    required,
    missing,
  };
}

export default function SettingsPage() {
  const providers = [
    providerStatus("Supabase Auth", "Admin sessions and protected operations console access.", [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]),
    providerStatus("Supabase Service Role", "Server-side persistence for cases, messages, appointments, knowledge, and audit logs.", [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]),
    providerStatus("OpenAI", "Assistant response generation and structured intake extraction.", ["OPENAI_API_KEY"]),
    providerStatus("Resend", "Operational email notifications for handoff and scheduling review.", [
      "RESEND_API_KEY",
      "TEAM_EMAIL",
      "FROM_EMAIL",
    ]),
    providerStatus("Google Calendar", "Availability checks and calendar-backed appointment events.", [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_REFRESH_TOKEN",
      "GOOGLE_CALENDAR_ID",
    ]),
  ];

  const settings = [
    ["Clinic", "Northstar Clinic"],
    ["Runtime mode", process.env.NODE_ENV || "development"],
    ["App URL", process.env.NEXT_PUBLIC_APP_URL || "Not configured"],
    ["OpenAI model", process.env.OPENAI_MODEL || "gpt-4.1-mini"],
    ["Timezone", process.env.CLINIC_TIMEZONE || "America/New_York"],
    ["Default duration", `${process.env.DEFAULT_APPOINTMENT_DURATION_MINUTES || 45} minutes`],
  ];

  const rules = [
    "No diagnosis, prescriptions, treatment plans, or exam interpretation.",
    "No diet prescriptions or supplement advice.",
    "Use active knowledge-base items for administrative answers.",
    "Escalate urgent, sensitive, or ambiguous requests to human staff.",
    "Store structured intake summary and conversation trail.",
  ];

  const configuredCount = providers.filter((provider) => provider.configured).length;

  return (
    <AdminLayout>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="medbay-label">Trust center</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#262626]">Safety Rules / Settings</h1>
          <p className="mt-1 text-sm text-[#737373]">
            Provider readiness, runtime configuration, and deterministic safety boundaries.
          </p>
        </div>
        <div className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] px-5 py-4">
          <p className="text-sm text-[#737373]">Configured providers</p>
          <p className="mt-1 text-3xl font-semibold text-[#262626]">
            {configuredCount}/{providers.length}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_390px]">
        <section className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#dbeafe] text-[#1d4ed8]">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-[#262626]">Provider readiness</h2>
              <p className="text-sm text-[#737373]">Secrets are never displayed, only configuration state.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {providers.map((provider) => (
              <article key={provider.name} className="rounded-lg border border-[#ededed] bg-[#fafafa] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-[#262626]">{provider.name}</h3>
                    <p className="mt-1 text-sm leading-5 text-[#737373]">{provider.description}</p>
                  </div>
                  <StatusBadge configured={provider.configured} />
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div>
                    <dt className="font-semibold text-[#262626]">Required env</dt>
                    <dd className="mt-1 text-[#737373]">{provider.required.join(", ")}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#262626]">Missing</dt>
                    <dd className={provider.missing.length ? "mt-1 text-amber-700" : "mt-1 text-[#1d4ed8]"}>
                      {provider.missing.length ? provider.missing.join(", ") : "None"}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#dbeafe] text-[#1d4ed8]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h2 className="font-semibold text-[#262626]">Runtime configuration</h2>
            </div>
            <dl className="mt-5 space-y-4">
              {settings.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm font-semibold text-[#262626]">{label}</dt>
                  <dd className="mt-1 break-words text-sm text-[#737373]">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#dbeafe] text-[#1d4ed8]">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h2 className="font-semibold text-[#262626]">AI safety rules</h2>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-[#737373]">
              {rules.map((rule) => (
                <li key={rule} className="rounded-md border border-[#ededed] bg-[#fafafa] p-3">
                  {rule}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </AdminLayout>
  );
}

function StatusBadge({ configured }: { configured: boolean }) {
  return (
    <span
      className={
        configured
          ? "inline-flex items-center gap-1 rounded-full bg-[#dbeafe] px-2.5 py-1 text-xs font-semibold text-[#1d4ed8]"
          : "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"
      }
    >
      {configured ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {configured ? "Configured" : "Missing"}
    </span>
  );
}
