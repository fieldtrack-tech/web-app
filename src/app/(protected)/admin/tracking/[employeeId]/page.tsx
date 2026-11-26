import { LiveTracking } from "@/components/maps/LiveTracking";

export default async function EmployeeTrackingPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;
  return <LiveTracking key={employeeId} employeeId={employeeId} />;
}
