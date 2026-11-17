"use client";

import { Trash2 } from "lucide-react";
import { deleteCandidate } from "@/features/admin/candidate-actions";

export function DeleteCandidateForm({ candidateId, name }: { candidateId: string; name: string }) {
  return (
    <form action={deleteCandidate}>
      <input type="hidden" name="candidate_id" value={candidateId} />
      <button
        type="submit"
        onClick={(event) => {
          if (!window.confirm(`Supprimer définitivement la fiche de ${name} ?`)) event.preventDefault();
        }}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/20 px-4 text-sm font-medium text-red-200 transition hover:bg-red-400/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
      >
        <Trash2 size={15} /> Supprimer la fiche
      </button>
    </form>
  );
}
