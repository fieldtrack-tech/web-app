import { redirect } from "next/navigation";

export default function EmployeeProfileCompatPage({ params }: { params: { id: string } }) {
  redirect(`/admin/employees/${params.id}`);
}
