"use server";
import { redirect } from "next/navigation";
import { createWaitlistSignup } from "@/modules/waitlist/server";
import { reportOperationalTelemetry } from "@/modules/telemetry/operational";

export async function submitSignup(formData: FormData) {
  const result = await createWaitlistSignup({
    email: String(formData.get("email")), station: String(formData.get("station")), poster: String(formData.get("poster")), frequency: String(formData.get("frequency")), when: String(formData.get("when")), price: String(formData.get("price")), priceOther: String(formData.get("priceOther")), formats: formData.getAll("formats").map(String), wantsToJoin: String(formData.get("wantsToJoin")), consent: String(formData.get("consent")), honeypot: String(formData.get("company")),
  });
  void reportOperationalTelemetry({ type: "server_action", action: "waitlist_signup", outcome: result.result === "created" ? "success" : "rejected" });
  if (result.result === "created") redirect(`/voucher/${result.voucherCode}`);
  redirect(`/signup?status=${result.result}`);
}
