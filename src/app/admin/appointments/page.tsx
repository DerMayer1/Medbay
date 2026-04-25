import { AdminLayout } from "@/components/admin/AdminLayout";
import { AppointmentCreator } from "@/components/admin/AppointmentCreator";
import { AppointmentTable } from "@/components/admin/AppointmentTable";
import { listAppointments } from "@/lib/repository";

export default async function AppointmentsPage() {
  const appointments = await listAppointments();

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-white">Appointments</h1>
      <p className="mt-1 text-sm text-slate-400">Pending, confirmed, and calendar-backed scheduling records.</p>
      <div className="mt-6">
        <AppointmentCreator />
      </div>
      <div className="mt-6 overflow-x-auto">
        <AppointmentTable appointments={appointments as Array<Record<string, unknown>>} />
      </div>
    </AdminLayout>
  );
}
