import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getSiteUrl } from "@/lib/supabase/server";

function safeNextPath(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/pronostics";
  return path;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const nextPath = safeNextPath(params.get("next"));
  const supabase = await createServerSupabaseClient();
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  let error: Error | null = null;
  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  }

  if (!error && (code || (tokenHash && type))) {
    return NextResponse.redirect(new URL(nextPath, getSiteUrl()));
  }

  return NextResponse.redirect(new URL("/connexion?status=confirmation-error", getSiteUrl()));
}
