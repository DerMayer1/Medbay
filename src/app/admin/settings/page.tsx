import { AdminLayout } from "@/components/admin/AdminLayout";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const settings = [
    ["Clinic", "Northstar Clinic"],
    ["Runtime mode", "Production"],
    ["Team email", process.env.TEAM_EMAIL || "Not configured"],
    ["Timezone", process.env.CLINIC_TIMEZONE || "America/New_York"],
    ["Default duration", `${process.env.DEFAULT_APPOINTMENT_DURATION_MINUTES || 45} minutes`],
    ["Calendar provider", process.env.GOOGLE_CALENDAR_ID ? "Google Calendar" : "Not configured"],
  ];

  const rules = [
    "No diagnosis, prescriptions, treatment plans, or exam interpretation.",
    "No diet prescriptions or supplement advice.",
    "Use active knowledge-base items for administrative answers.",
    "Escalate urgent, sensitive, or ambiguous requests to human staff.",
    "Store structured intake summary and conversation trail.",
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-white">Safety Rules / Settings</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold text-white">Runtime configuration</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {settings.map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm font-semibold text-slate-300">{label}</dt>
                <dd className="mt-1 text-sm text-slate-500">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="rounded-xl border border-white/10 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold text-white">AI safety rules</h2>
          <ul className="mt-5 space-y-3 text-sm text-slate-400">
            {rules.map((rule) => (
              <li key={rule} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                {rule}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminLayout>
  );
}
