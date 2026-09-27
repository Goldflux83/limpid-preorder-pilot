export function participantPageUrl(code: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${baseUrl}/k/${encodeURIComponent(code)}`;
}
