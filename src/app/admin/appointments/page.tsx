import { AdminLayout } from "@/components/admin/AdminLayout";
import { AppointmentCreator } from "@/components/admin/AppointmentCreator";
import { AppointmentTable } from "@/components/admin/AppointmentTable";
import { withDemoFallback } from "@/lib/demoData";
import { listDemoAppointments } from "@/lib/demoStore";
import { isPortfolioAdminSession } from "@/lib/portfolioAccess";
import { listAppointments } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const demoAppointments = listDemoAppointments();
  const appointments = (await isPortfolioAdminSession())
    ? demoAppointments
    : await withDemoFallback(listAppointments(), demoAppointments);

  return (
    <AdminLayout>
      <p className="medbay-label">Scheduling</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#262626]">Appointments</h1>
      <p className="mt-1 text-sm text-[#737373]">Pending, confirmed, and calendar-backed scheduling records.</p>
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.08em] text-[#64748b]">Requests and bookings</h2>
      <div className="mt-3">
        <AppointmentTable appointments={appointments as Array<Record<string, unknown>>} />
      </div>
      <div className="mt-8">
        <AppointmentCreator />
      </div>
    </AdminLayout>
  );
}
