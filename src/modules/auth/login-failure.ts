export type AdminLoginFailure = "invalid" | "email-not-confirmed" | "auth-unavailable" | "configuration";

export function classifyAdminLoginFailure(error: { code?: string; name?: string }): AdminLoginFailure {
  if (error.code === "email_not_confirmed") return "email-not-confirmed";
  if (error.name === "AuthRetryableFetchError") return "auth-unavailable";
  return "invalid";
}
