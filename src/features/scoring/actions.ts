"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function calculateScores() {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims.sub) redirect("/connexion");

  const { data: edition, error: editionError } = await supabase
    .from("editions")
    .select("id")
    .eq("slug", "miss-france-2027")
    .maybeSingle();
  if (editionError || !edition) redirect("/admin?status=unavailable");

  const { data, error } = await supabase.rpc("calculate_edition_scores", {
    target_edition_id: edition.id,
  });
  if (error) {
    console.error("calculate_edition_scores failed", { code: error.code, message: error.message });
    if (error.code === "42501") redirect("/admin?status=forbidden");
    if (error.message.includes("prediction deadline must have passed")) redirect("/admin?status=deadline-open");
    if (error.message.includes("12 published official results")) redirect("/admin?status=results-incomplete");
    if (error.message.includes("12 scoring rules")) redirect("/admin?status=rules-incomplete");
    redirect("/admin?status=calculation-error");
  }
  redirect(`/admin?status=calculated&count=${Number(data) || 0}`);
}
