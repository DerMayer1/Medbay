import { AdminLayout } from "@/components/admin/AdminLayout";
import { AppointmentCreator } from "@/components/admin/AppointmentCreator";
import { AppointmentTable } from "@/components/admin/AppointmentTable";
import { demoAppointments, withDemoFallback } from "@/lib/demoData";
import { isPortfolioAdminSession } from "@/lib/portfolioAccess";
import { listAppointments } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const appointments = (await isPortfolioAdminSession())
    ? demoAppointments
    : await withDemoFallback(listAppointments(), demoAppointments);

  return (
    <AdminLayout>
      <p className="medbay-label">Scheduling</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#262626]">Appointments</h1>
      <p className="mt-1 text-sm text-[#737373]">Pending, confirmed, and calendar-backed scheduling records.</p>
      <div className="mt-6">
        <AppointmentCreator />
      </div>
      <div className="mt-6 overflow-x-auto">
        <AppointmentTable appointments={appointments as Array<Record<string, unknown>>} />
      </div>
    </AdminLayout>
  );
}
