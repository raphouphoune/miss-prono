import type { Candidate } from "@/types";

const storageKey = "miss-prono:prediction:2027";

export type LocalPrediction = {
  candidateIds: string[];
  status: "draft" | "submitted";
  savedAt: string;
};

export function isCompletePrediction(candidateIds: string[]) {
  return candidateIds.length === 12 && new Set(candidateIds).size === 12;
}

export function readLocalPrediction(candidates: Candidate[]): LocalPrediction | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<LocalPrediction>;
    if (!Array.isArray(parsed.candidateIds)) return null;

    const availableIds = new Set(candidates.map(({ id }) => id));
    const candidateIds = parsed.candidateIds.filter(
      (id): id is string => typeof id === "string" && availableIds.has(id)
    );
    const uniqueIds = [...new Set(candidateIds)].slice(0, 12);

    return {
      candidateIds: uniqueIds,
      status: parsed.status === "submitted" && isCompletePrediction(uniqueIds) ? "submitted" : "draft",
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : ""
    };
  } catch {
    return null;
  }
}

export function writeLocalPrediction(prediction: LocalPrediction) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(prediction));
    return true;
  } catch {
    return false;
  }
}
