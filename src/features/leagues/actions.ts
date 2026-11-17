"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createLeague(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 3 || name.length > 48) redirect("/ligues?status=invalid-name");

  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims.sub) redirect("/connexion");

  const { data: edition, error: editionError } = await supabase
    .from("editions")
    .select("id")
    .eq("slug", "miss-france-2027")
    .maybeSingle();
  if (editionError || !edition) redirect("/ligues?status=unavailable");

  const { error } = await supabase.rpc("create_league", {
    target_edition_id: edition.id,
    league_name: name,
  });
  if (error) {
    console.error("create_league failed", { code: error.code, message: error.message });
    redirect("/ligues?status=create-error");
  }
  redirect("/ligues?status=created");
}

export async function joinLeague(formData: FormData) {
  const code = String(formData.get("invite_code") ?? "").trim().toUpperCase();
  if (!/^[A-F0-9]{8,16}$/.test(code)) redirect("/ligues?status=invalid-code");

  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims.sub) redirect("/connexion");

  const { error } = await supabase.rpc("join_league_with_code", { invitation_code: code });
  if (error) {
    console.error("join_league_with_code failed", { code: error.code, message: error.message });
    redirect("/ligues?status=invalid-code");
  }
  redirect("/ligues?status=joined");
}
