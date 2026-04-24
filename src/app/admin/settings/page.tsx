import { AdminLayout } from "@/components/admin/AdminLayout";

export default function SettingsPage() {
  const settings = [
    ["Profissional", "Juliana Pansardi"],
    ["E-mail da equipe", process.env.TEAM_EMAIL || "Não configurado"],
    ["Fuso horário", process.env.CLINIC_TIMEZONE || "America/Sao_Paulo"],
    ["Duração padrão", `${process.env.DEFAULT_APPOINTMENT_DURATION_MINUTES || 60} minutos`],
    ["Modo de agenda", process.env.CALENDAR_MODE || "suggest_only"],
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold">Configurações</h1>
      <div className="mt-6 rounded-lg border border-[#d9ded6] bg-white p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          {settings.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm font-semibold text-[#43514c]">{label}</dt>
              <dd className="mt-1 text-sm text-[#66746f]">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </AdminLayout>
  );
}
