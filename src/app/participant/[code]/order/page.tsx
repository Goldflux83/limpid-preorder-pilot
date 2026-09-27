import { redirect } from "next/navigation";

export default async function ParticipantOrderRedirect({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/k/${code}`);
}
