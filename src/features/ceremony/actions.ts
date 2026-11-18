"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getRelayEdition() {
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims.sub) redirect("/connexion");
  const { data: edition, error } = await supabase.from("editions").select("id").eq("slug", "miss-france-2027").maybeSingle();
  if (error || !edition) redirect("/annonceur?status=unavailable");
  return { supabase, edition };
}

export async function setCeremonyAnnouncer(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "");
  const allow = formData.get("allow") === "true";
  if (!/^[0-9a-f-]{36}$/i.test(userId)) redirect("/admin/annonciateurs?status=invalid");
  const { supabase, edition } = await getRelayEdition();
  const { error } = await supabase.rpc("admin_set_ceremony_announcer", {
    target_edition_id: edition.id, target_user_id: userId, allow_announcement: allow,
  });
  if (error) {
    console.error("admin_set_ceremony_announcer failed", { code: error.code, message: error.message });
    if (error.code === "42501") redirect("/");
    redirect("/admin/annonciateurs?status=error");
  }
  revalidatePath("/admin/annonciateurs");
  revalidatePath("/annonceur");
  redirect(`/admin/annonciateurs?status=${allow ? "added" : "removed"}`);
}

export async function publishCandidateAnnouncement(formData: FormData) {
  const candidateId = String(formData.get("candidate_id") ?? "");
  const type = String(formData.get("announcement_type") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(candidateId) || !["semi_finalists", "finalists", "placement"].includes(type)) {
    redirect("/annonceur?status=invalid");
  }
  const { supabase, edition } = await getRelayEdition();
  const { error } = await supabase.rpc("announcer_publish_candidate", {
    target_edition_id: edition.id, target_candidate_id: candidateId, announcement_type: type,
  });
  if (error) {
    console.error("announcer_publish_candidate failed", { code: error.code, message: error.message });
    if (error.code === "42501") redirect("/");
    redirect("/annonceur?status=publish-error");
  }
  revalidatePath("/annonceur");
  revalidatePath("/resultats");
  revalidatePath("/classement");
  revalidatePath("/ligues");
  redirect("/annonceur?status=published");
}

export async function retractCandidateAnnouncement(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(eventId)) redirect("/annonceur?status=invalid");
  const { supabase, edition } = await getRelayEdition();
  const { error } = await supabase.rpc("announcer_retract_latest_candidate_event", {
    target_edition_id: edition.id, target_event_id: eventId,
  });
  if (error) {
    console.error("announcer_retract_latest_candidate_event failed", { code: error.code, message: error.message });
    if (error.code === "42501") redirect("/");
    redirect("/annonceur?status=retract-error");
  }
  revalidatePath("/annonceur");
  revalidatePath("/resultats");
  revalidatePath("/classement");
  revalidatePath("/ligues");
  redirect("/annonceur?status=retracted");
}

export async function toggleLeagueEventReaction(formData: FormData) {
  const leagueId = String(formData.get("league_id") ?? "");
  const eventId = String(formData.get("event_id") ?? "");
  const reaction = String(formData.get("reaction") ?? "");
  if (![leagueId, eventId].every((id) => /^[0-9a-f-]{36}$/i.test(id)) || !["👏", "🔥", "👑"].includes(reaction)) return;
  const { supabase } = await getRelayEdition();
  const { error } = await supabase.rpc("set_league_event_reaction", {
    target_league_id: leagueId, target_event_id: eventId, requested_reaction: reaction,
  });
  if (error) console.error("set_league_event_reaction failed", { code: error.code, message: error.message });
  revalidatePath("/ligues");
}
