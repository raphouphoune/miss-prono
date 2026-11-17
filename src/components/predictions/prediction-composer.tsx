"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Crown, GripVertical, LockKeyhole, Plus, Search, Trash2, X } from "lucide-react";
import type { Candidate } from "@/types";
import { isCompletePrediction, readLocalPrediction } from "@/features/predictions/local-draft";
import { savePrediction } from "@/features/predictions/actions";
import type { PredictionPageData } from "@/features/predictions/repository";

const places = [
  "Miss France",
  "Première dauphine",
  "Deuxième dauphine",
  "Troisième dauphine",
  "Quatrième dauphine"
];

function normalize(value: string) {
  return value.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function placeTitle(index: number) {
  return places[index] ?? `Top 12 · Rang ${index + 1}`;
}

type PredictionComposerProps = {
  candidates: Candidate[];
  prediction: PredictionPageData;
};

export function PredictionComposer({ candidates, prediction }: PredictionComposerProps) {
  const validInitialIds = prediction.candidateSlugs.filter((slug) => candidates.some((candidate) => candidate.id === slug));
  const [selectedIds, setSelectedIds] = useState<string[]>(validInitialIds);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(prediction.savedAt ?? "");
  const [status, setStatus] = useState<"draft" | "submitted">(prediction.status);
  const [reviewing, setReviewing] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState(false);
  const [saving, setSaving] = useState(false);
  const canModify = prediction.canSaveDraft && status !== "submitted" && !saving;

  const regions = useMemo(
    () => [...new Set(candidates.map(({ region: candidateRegion }) => candidateRegion))].sort((a, b) => a.localeCompare(b, "fr")),
    [candidates]
  );

  const selectedCandidates = selectedIds
    .map((id) => candidates.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is Candidate => Boolean(candidate));

  const availableCandidates = useMemo(() => {
    const search = normalize(query.trim());
    return candidates.filter((candidate) => {
      const matchesRegion = region === "all" || candidate.region === region;
      const details = `${candidate.name} ${candidate.region} ${candidate.hometown ?? ""} ${candidate.occupation ?? ""} ${candidate.education ?? ""}`;
      return matchesRegion && (!search || normalize(details).includes(search));
    });
  }, [candidates, query, region]);

  useEffect(() => {
    if (prediction.candidateSlugs.length > 0 || prediction.status === "submitted" || !prediction.canSaveDraft) return;
    const frame = window.requestAnimationFrame(() => {
      const localDraft = readLocalPrediction(candidates);
      if (localDraft?.candidateIds.length) {
        setSelectedIds(localDraft.candidateIds);
        setDirty(true);
        setActionMessage("Un ancien brouillon de cet appareil est chargé. Enregistre-le pour l’associer à ton compte.");
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [candidates, prediction]);

  function markEdited(nextIds: string[]) {
    setSelectedIds(nextIds);
    setDirty(true);
    setReviewing(false);
    setActionMessage("");
    setActionError(false);
  }

  function addCandidate(candidateId: string) {
    if (selectedIds.length >= 12 || selectedIds.includes(candidateId)) return;
    markEdited([...selectedIds, candidateId]);
    const candidate = candidates.find(({ id }) => id === candidateId);
    setAnnouncement(`${candidate?.name ?? "Candidate"} ajoutée en position ${selectedIds.length + 1}.`);
  }

  function removeCandidate(candidateId: string) {
    const index = selectedIds.indexOf(candidateId);
    if (index < 0) return;
    const candidate = candidates.find(({ id }) => id === candidateId);
    markEdited(selectedIds.filter((id) => id !== candidateId));
    setAnnouncement(`${candidate?.name ?? "Candidate"} retirée du classement.`);
  }

  function moveCandidate(candidateId: string, targetIndex: number) {
    const currentIndex = selectedIds.indexOf(candidateId);
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= selectedIds.length || currentIndex === targetIndex) return;
    const reordered = [...selectedIds];
    reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, candidateId);
    markEdited(reordered);
    const candidate = candidates.find(({ id }) => id === candidateId);
    setAnnouncement(`${candidate?.name ?? "Candidate"} déplacée en position ${targetIndex + 1}.`);
  }

  async function save(statusToSave: "draft" | "submitted" = "draft") {
    if (saving || !prediction.canSaveDraft || (statusToSave === "submitted" && !prediction.canSubmit)) return;
    setSaving(true);
    setActionMessage("");
    setActionError(false);
    const formData = new FormData();
    formData.set("candidate_slugs", JSON.stringify(selectedIds));
    formData.set("submit", String(statusToSave === "submitted"));
    const result = await savePrediction(formData);
    setSaving(false);
    if (!result.ok) {
      setActionMessage(result.message);
      setActionError(true);
      return;
    }
    setSavedAt(result.savedAt);
    setStatus(result.status);
    setDirty(false);
    setActionMessage(result.status === "submitted" ? "Ton pronostic est confirmé et reste privé jusqu’à la clôture." : "Brouillon enregistré sur ton compte.");
    if (result.status === "submitted") setReviewing(false);
  }

  function confirmPrediction() {
    if (!isCompletePrediction(selectedIds) || !prediction.canSubmit) return;
    void save("submitted");
  }

  function clearSearch() {
    setQuery("");
    setRegion("all");
  }

  return (
    <main className="section-wrap pb-16 sm:pb-24">
      <header className="relative overflow-hidden rounded-3xl border border-gold/20 bg-[radial-gradient(ellipse_at_80%_20%,rgba(200,164,93,0.16),transparent_42%),linear-gradient(120deg,#1a1711,#11100e)] px-6 py-9 sm:px-10 sm:py-12">
        <div aria-hidden="true" className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-gold/10" />
        <p className="section-eyebrow inline-flex items-center gap-2"><Crown size={14} /> Édition 2027</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.02] tracking-[-0.025em] text-champagne sm:text-5xl lg:text-6xl">
          Votre Top 12<span className="gold-text italic">.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
          Choisissez vos douze favorites et classez-les de la future Miss France aux autres candidates du Top 12.
        </p>
      </header>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-gold/20 bg-gold/[0.045] px-4 py-3.5 text-xs leading-5 text-white/55">
        <LockKeyhole size={16} className="mt-0.5 shrink-0 text-gold" />
        <p>
          {prediction.editionStatus === "upcoming"
            ? "Ton brouillon peut être enregistré sur ton compte dès maintenant. Il reste privé; la confirmation finale sera ouverte avec la période officielle des pronostics."
            : prediction.editionStatus === "open"
              ? "Ton brouillon reste privé et n’est visible que par toi jusqu’à la clôture officielle des pronostics."
              : prediction.editionStatus === "closed"
                ? "La période de pronostics est fermée. Tu peux consulter ton classement, mais les modifications ne sont plus possibles."
                : "Les données du pronostic ne sont pas disponibles. Vérifie que les migrations Supabase sont appliquées."}
          {prediction.deadline && prediction.editionStatus !== "closed" && <> Clôture le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(prediction.deadline))}.</>}
        </p>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <section aria-labelledby="candidate-picker-title" className="min-w-0 rounded-2xl border border-white/10 bg-[#171614] p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-eyebrow">Sélection</p>
              <h2 id="candidate-picker-title" className="mt-2 font-display text-3xl text-champagne sm:text-4xl">Les candidates</h2>
            </div>
            <p className="text-sm font-medium text-white/55"><span className="text-gold">{selectedIds.length}</span> / 12 choisies</p>
          </div>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div className="h-full rounded-full bg-gradient-to-r from-gold to-[#f0d69d] transition-[width]" style={{ width: `${(selectedIds.length / 12) * 100}%` }} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <label className="relative block">
              <span className="sr-only">Rechercher une candidate</span>
              <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom ou région" type="search" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-10 pr-4 text-sm text-ivory outline-none placeholder:text-white/35 focus:border-gold/55 focus:ring-2 focus:ring-gold/15" />
            </label>
            <label>
              <span className="sr-only">Filtrer par région</span>
              <select value={region} onChange={(event) => setRegion(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[#171614] px-4 text-sm text-ivory outline-none focus:border-gold/55 focus:ring-2 focus:ring-gold/15">
                <option value="all">Toutes les régions</option>
                {regions.map((candidateRegion) => <option key={candidateRegion} value={candidateRegion}>{candidateRegion}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-4 max-h-[780px] divide-y divide-white/[0.07] overflow-y-auto pr-1">
            {availableCandidates.map((candidate) => {
              const selected = selectedIds.includes(candidate.id);
              const full = selectedIds.length >= 12;
              return (
                <div key={candidate.id} className="flex items-center gap-3 py-3 first:pt-0 sm:gap-4">
                  <Image src={candidate.imageSrc} alt="" width={48} height={60} className="h-[60px] w-12 shrink-0 rounded-lg object-cover object-top" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ivory">{candidate.name}</p>
                    <p className="mt-1 truncate text-xs text-white/45">{candidate.region}{candidate.age ? ` · ${candidate.age} ans` : ""}</p>
                  </div>
                  <button type="button" onClick={() => addCandidate(candidate.id)} disabled={!canModify || selected || full} aria-label={selected ? `${candidate.name} est déjà choisie` : `Ajouter ${candidate.name}`} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-gold/30 px-3 text-xs font-semibold text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/35">
                    {selected ? <><Check size={14} /> Choisie</> : <><Plus size={14} /> Ajouter</>}
                  </button>
                </div>
              );
            })}
            {availableCandidates.length === 0 && <p className="py-10 text-center text-sm text-white/45">Aucune candidate ne correspond à votre recherche. <button type="button" onClick={clearSearch} className="text-gold underline underline-offset-4">Effacer les filtres</button></p>}
          </div>
        </section>

        <aside className="min-w-0 self-start rounded-2xl border border-gold/20 bg-[linear-gradient(160deg,#1d1a15,#131210_60%)] p-5 sm:p-7 xl:sticky xl:top-24">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="section-eyebrow">Votre classement</p>
              <h2 className="mt-2 font-display text-3xl text-champagne sm:text-4xl">Les 12 places</h2>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55">{12 - selectedIds.length} restante{12 - selectedIds.length === 1 ? "" : "s"}</span>
          </div>

          <ol className="mt-5 space-y-2.5" aria-label="Ordre de votre pronostic">
            {Array.from({ length: 12 }, (_, index) => {
              const candidate = selectedCandidates[index];
              return (
                <li key={index} onDragOver={(event) => { if (candidate && draggedId) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); if (candidate && draggedId) moveCandidate(draggedId, index); setDraggedId(null); }} className={`min-h-[72px] rounded-xl border ${candidate ? "border-white/10 bg-black/20" : "border-dashed border-white/[0.13] bg-white/[0.015]"}`}>
                  {candidate ? (
                    <div draggable={canModify} onDragStart={(event) => { setDraggedId(candidate.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", candidate.id); }} onDragEnd={() => setDraggedId(null)} className={`flex min-h-[72px] items-center gap-2.5 px-3 py-2 sm:gap-3 ${draggedId === candidate.id ? "opacity-40" : ""}`}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/25 font-display text-lg text-gold">{index + 1}</span>
                      <Image src={candidate.imageSrc} alt="" width={42} height={52} className="h-[52px] w-[42px] shrink-0 rounded-md object-cover object-top" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">{placeTitle(index)}</p>
                        <p className="mt-1 truncate text-sm font-medium text-ivory">{candidate.name}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button type="button" disabled={!canModify || index === 0} onClick={() => moveCandidate(candidate.id, index - 1)} aria-label={`Monter ${candidate.name}`} className="grid h-9 w-8 place-items-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-ivory disabled:opacity-20"><ArrowUp size={15} /></button>
                        <button type="button" disabled={!canModify || index === selectedIds.length - 1} onClick={() => moveCandidate(candidate.id, index + 1)} aria-label={`Descendre ${candidate.name}`} className="grid h-9 w-8 place-items-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-ivory disabled:opacity-20"><ArrowDown size={15} /></button>
                        <span aria-hidden="true" className="hidden text-white/25 sm:inline-flex"><GripVertical size={17} /></span>
                        <button type="button" disabled={!canModify} onClick={() => removeCandidate(candidate.id)} aria-label={`Retirer ${candidate.name}`} className="grid h-9 w-8 place-items-center rounded-lg text-white/35 transition hover:bg-red-400/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-20"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[72px] items-center gap-3 px-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 font-display text-lg text-white/30">{index + 1}</span>
                      <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">{placeTitle(index)}</p><p className="mt-1 text-xs text-white/25">À compléter</p></div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-5 border-t border-white/10 pt-5">
            {reviewing ? (
              <div className="rounded-xl border border-gold/25 bg-gold/[0.06] p-4">
                <div className="flex items-start gap-3">
                  <Check className="mt-0.5 shrink-0 text-gold" size={18} />
                  <div><h3 className="font-medium text-champagne">Vérifie ton Top 12</h3><p className="mt-1 text-xs leading-5 text-white/50">Les cinq premières places forment le Top 5. Après confirmation, le choix restera privé jusqu’à la clôture.</p></div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={confirmPrediction} disabled={saving} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-semibold text-[#17130c] transition hover:bg-[#ddbd7e] disabled:cursor-wait disabled:opacity-60"><Check size={16} /> {saving ? "Enregistrement…" : "Confirmer le pronostic"}</button>
                  <button type="button" onClick={() => setReviewing(false)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-medium text-white/65 transition hover:bg-white/[0.05]"><X size={15} /> Continuer à modifier</button>
                </div>
              </div>
            ) : status === "submitted" ? (
              <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
                <div className="flex items-start gap-3"><Check className="mt-0.5 shrink-0 text-emerald-300" size={18} /><div><p className="text-sm font-medium text-emerald-100">Pronostic confirmé</p><p className="mt-1 text-xs leading-5 text-white/45">Il est enregistré sur ton compte et restera privé jusqu’à la clôture officielle.</p></div></div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => void save("draft")} disabled={!canModify || selectedIds.length === 0 || !dirty || saving} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-gold/30 px-4 text-sm font-semibold text-champagne transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30"><Check size={15} /> {saving ? "Enregistrement…" : "Enregistrer le brouillon"}</button>
                <button type="button" onClick={() => setReviewing(true)} disabled={!canModify || !prediction.canSubmit || !isCompletePrediction(selectedIds)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-semibold text-[#17130c] transition hover:bg-[#ddbd7e] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30">Vérifier mon pronostic <Check size={15} /></button>
              </div>
            )}
            <p aria-live="polite" className={`mt-3 min-h-4 text-xs ${actionError ? "text-red-200/80" : "text-white/45"}`}>{actionMessage || (dirty ? "Modifications non enregistrées." : savedAt ? `Enregistré à ${new Date(savedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}.` : "Ton brouillon n’est pas encore enregistré.")}</p>
          </div>
        </aside>
      </div>

      <p className="sr-only" aria-live="polite">{announcement}</p>
      <p className="mt-5 text-center text-xs leading-5 text-white/35">Glissez les candidates pour modifier leur ordre, ou utilisez les flèches pour les déplacer. Consultez les <Link href="/candidates" className="text-gold underline underline-offset-4">profils des candidates</Link>.</p>
    </main>
  );
}
