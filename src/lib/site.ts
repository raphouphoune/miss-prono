export function getPublicSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL
    ?? process.env.VERCEL_PROJECT_PRODUCTION_URL
    ?? process.env.NEXT_PUBLIC_VERCEL_URL
    ?? process.env.VERCEL_URL;
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    if (url.protocol !== "https:" && process.env.NODE_ENV === "production") return null;
    return url;
  } catch {
    return null;
  }
}
