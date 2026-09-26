"use server";
import { redirect } from "next/navigation";
import { openStoreSession } from "@/modules/store/session";
export async function openSession(formData: FormData) {
  const station = String(formData.get("station"));
  const pin = String(formData.get("pin"));
  if (
    !/^[A-Z]{2,8}$/i.test(station) ||
    !/^\d{4}$/.test(pin) ||
    !(await openStoreSession(station, pin))
  )
    redirect(`/store/${station}/login?error=invalid`);
  redirect(`/store/${station}`);
}
