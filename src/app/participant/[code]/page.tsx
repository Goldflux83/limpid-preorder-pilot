import { redirect } from "next/navigation";

export default async function ParticipantRedirect({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/k/${code}`);
}
