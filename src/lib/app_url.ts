import { appBaseUrl } from "./runtime-config";

export function participantPageUrl(code: string) {
  return `${appBaseUrl()}/k/${encodeURIComponent(code)}`;
}
