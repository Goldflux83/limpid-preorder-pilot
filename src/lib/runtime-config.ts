export function requiredRuntimeValue(name: string, developmentFallback?: string) {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV !== "production" && developmentFallback) return developmentFallback;
  throw new Error(`${name} is required`);
}

export function appBaseUrl() {
  const value = requiredRuntimeValue("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL must be an absolute URL");
  }
}
