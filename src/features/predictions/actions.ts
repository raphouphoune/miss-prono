"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

type SavePredictionResult =
  | { ok: true; status: "draft" | "submitted"; savedAt: string }
  | { ok: false; message: string };

export async function savePrediction(formData: FormData): Promise<SavePredictionResult> {
  const rawSlugs = formData.get("candidate_slugs");
  let candidateSlugs: unknown;
  try {
    candidateSlugs = JSON.parse(String(rawSlugs ?? ""));
  } catch {
    return { ok: false, message: "La sélection reçue est invalide. Recharge la page puis réessaie." };
  }

  if (!Array.isArray(candidateSlugs) || candidateSlugs.length > 12 || candidateSlugs.some((slug) => typeof slug !== "string" || slug.length > 100)) {
    return { ok: false, message: "La sélection doit contenir au maximum 12 candidates valides." };
  }

  const submit = formData.get("submit") === "true";
  if (submit && (candidateSlugs.length !== 12 || new Set(candidateSlugs).size !== 12)) {
    return { ok: false, message: "Pour confirmer, sélectionne 12 candidates différentes." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims.sub) return { ok: false, message: "Ta session a expiré. Reconnecte-toi pour continuer." };

  try {
    const { error } = await supabase.rpc("save_my_prediction", {
      target_edition_slug: "miss-france-2027",
      candidate_slugs: candidateSlugs,
      submit_prediction: submit,
    });
    if (error) {
      // Keep the user-facing message simple, but retain PostgREST diagnostics
      // in the server logs so configuration/RLS errors are actionable.
      console.error("save_my_prediction failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes("not open") || errorMessage.includes("not available")) {
        return { ok: false, message: "Cette édition n’accepte pas de modification en ce moment." };
      }
      if (errorMessage.includes("already been submitted")) {
        return { ok: false, message: "Ce pronostic a déjà été confirmé et ne peut plus être modifié ici." };
      }
      if (errorMessage.includes("must remain submitted")) {
        return { ok: false, message: "Ton pronostic est déjà confirmé. Pour le modifier, confirme à nouveau les 12 candidates." };
      }
      if (errorMessage.includes("do not belong") || errorMessage.includes("more than once")) {
        return { ok: false, message: "La sélection contient une candidate invalide ou en double." };
      }
      if (error.code === "42501") {
        return { ok: false, message: "La base de données a refusé l’enregistrement. Les droits Supabase ou les migrations de pronostics doivent être vérifiés." };
      }
      if (error.code === "PGRST202" || error.code === "42883") {
        return { ok: false, message: "La fonction d’enregistrement manque dans Supabase. Applique les migrations du projet puis réessaie." };
      }
      if (error.code === "23514") {
        return { ok: false, message: "Pour confirmer ton pronostic, sélectionne exactement 12 candidates différentes." };
      }
      if (error.code === "55000") {
        return { ok: false, message: "La base Supabase n’autorise pas encore cette modification. Vérifie que la dernière migration des pronostics est appliquée." };
      }
      return { ok: false, message: "Le pronostic n’a pas pu être enregistré. Réessaie dans quelques instants. Si le problème continue, consulte les journaux du serveur." };
    }

    return { ok: true, status: submit ? "submitted" : "draft", savedAt: new Date().toISOString() };
  } catch (error) {
    console.error("save_my_prediction request failed", error);
    return { ok: false, message: "Le service est momentanément indisponible. Réessaie dans quelques instants." };
  }
}

export async function saveFavoriteCandidate(candidateSlug: string | null): Promise<{ ok: true } | { ok: false; message: string }> {
  if (candidateSlug !== null && (typeof candidateSlug !== "string" || candidateSlug.length > 100)) {
    return { ok: false, message: "Cette candidate n’est pas valide." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims.sub) return { ok: false, message: "Ta session a expiré. Reconnecte-toi pour continuer." };

  const { error } = await supabase.rpc("set_my_prediction_favorite", {
    target_edition_slug: "miss-france-2027",
    favorite_candidate_slug: candidateSlug,
  });

  if (error) {
    console.error("set_my_prediction_favorite failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    if (error.message.includes("not available") || error.message.includes("not open")) {
      return { ok: false, message: "Le coup de cœur ne peut plus être modifié pour cette édition." };
    }
    if (error.message.includes("already submitted")) {
      return { ok: false, message: "Le pronostic a été confirmé. Le coup de cœur ne peut plus être changé." };
    }
    if (error.message.includes("Candidate not found")) {
      return { ok: false, message: "Cette candidate ne fait pas partie de l’édition." };
    }
    return { ok: false, message: "Le coup de cœur n’a pas pu être enregistré. Vérifie que la nouvelle migration Supabase est appliquée." };
  }

  return { ok: true };
}
