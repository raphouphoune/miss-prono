import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("La configuration Supabase est incomplète.");
  return { url, key };
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; proxy.ts refreshes sessions before rendering.
        }
      },
    },
  });
}

export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (url) {
    const parsed = new URL(url);
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_SITE_URL doit utiliser HTTPS en production.");
    }
    return parsed.origin;
  }
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Impossible de déterminer l’URL publique de production.");
  }
  return "http://localhost:3000";
}
