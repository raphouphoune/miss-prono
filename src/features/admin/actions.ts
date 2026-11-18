"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getAdminEdition() {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims.sub) redirect("/connexion");

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_app_admin");
  if (adminError || !isAdmin) redirect("/");

  const { data: edition, error } = await supabase
    .from("editions")
    .select("id")
    .eq("slug", "miss-france-2027")
    .maybeSingle();
  if (error || !edition) redirect("/admin?status=unavailable");
  return { supabase, edition };
}
export async function saveOfficialResults(formData: FormData) {
  const candidateIds = formData.getAll("candidate_ids").map((value) => String(value));
  if (
    candidateIds.length !== 5 ||
    candidateIds.some((id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) ||
    new Set(candidateIds).size !== 5
  ) {
    redirect("/admin?status=invalid-results");
  }

  const publish = formData.get("publish_results") === "true";
  const { supabase, edition } = await getAdminEdition();
  const { error } = await supabase.rpc("admin_save_edition_results", {
    target_edition_id: edition.id,
    ranked_candidate_ids: candidateIds,
    publish_results: publish,
  });
  if (error) {
    console.error("admin_save_edition_results failed", { code: error.code, message: error.message });
    if (error.code === "42501") redirect("/");
    if (error.message.includes("only be published after the deadline")) redirect("/admin?status=publish-closed");
    redirect("/admin?status=results-error");
  }
  redirect(`/admin?status=${publish ? "results-published" : "results-saved"}`);
}

export async function saveScoringRules(formData: FormData) {
  const rawPoints = formData.getAll("points");
  const rawValues = rawPoints.map((value) => String(value).trim());
  const points = rawValues.map(Number);
  if (
    points.length !== 6 ||
    rawValues.some((value) => !/^\d+$/.test(value)) ||
    points.some((point) => !Number.isSafeInteger(point) || point < 0 || point > 2_147_483_647)
  ) {
    redirect("/admin?status=invalid-rules");
  }
  const expandedPoints = [...points.slice(0, 5), ...Array.from({ length: 7 }, () => points[5])];

  const { supabase, edition } = await getAdminEdition();
  const { error } = await supabase.rpc("admin_save_scoring_rules", {
    target_edition_id: edition.id,
    points_by_rank: expandedPoints,
  });
  if (error) {
    console.error("admin_save_scoring_rules failed", { code: error.code, message: error.message });
    if (error.code === "42501") redirect("/");
    redirect("/admin?status=rules-error");
  }
  redirect("/admin?status=rules-saved");
}

export async function saveCeremonyEvent(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "").trim();
  const stage = String(formData.get("stage") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const allowedStages = ["selection", "semi_finalists", "finalists", "winner", "custom"];
  if (
    (eventId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) ||
    !allowedStages.includes(stage) ||
    title.length < 3 || title.length > 100 ||
    body.length > 2000
  ) {
    redirect("/admin?status=invalid-event");
  }

  const publish = formData.get("publish_event") === "true";
  const { supabase, edition } = await getAdminEdition();
  const { error } = await supabase.rpc("admin_save_ceremony_event", {
    target_edition_id: edition.id,
    target_event_id: eventId || null,
    event_stage: stage,
    event_title: title,
    event_body: body,
    publish_event: publish,
  });
  if (error) {
    console.error("admin_save_ceremony_event failed", { code: error.code, message: error.message });
    if (error.code === "42501") redirect("/");
    if (error.message.includes("only be published while the edition is live")) redirect("/admin?status=event-publish-closed");
    redirect("/admin?status=event-error");
  }
  redirect(`/admin?status=${publish ? "event-published" : "event-saved"}`);
}
