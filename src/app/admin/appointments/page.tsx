import { AdminLayout } from "@/components/admin/AdminLayout";
import { AppointmentTable } from "@/components/admin/AppointmentTable";
import { listAppointments } from "@/lib/repository";

export default async function AppointmentsPage() {
  const appointments = await listAppointments();

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold">Agenda</h1>
      <p className="mt-1 text-sm text-[#66746f]">Agendamentos pendentes, confirmados e sincronizados.</p>
      <div className="mt-6 overflow-x-auto">
        <AppointmentTable appointments={appointments as Array<Record<string, unknown>>} />
      </div>
    </AdminLayout>
  );
}
