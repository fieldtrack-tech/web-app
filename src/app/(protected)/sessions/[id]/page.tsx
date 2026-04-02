import { redirect } from "next/navigation";

export default function SessionDetailCompatPage({ params }: { params: { id: string } }) {
  redirect(`/employee/sessions/${params.id}`);
}
