import { redirect } from "next/navigation";

export default async function SessionDetailCompatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/employee/sessions/${id}`);
}
