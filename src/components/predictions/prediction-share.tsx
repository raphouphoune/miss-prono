"use client";

import { useState } from "react";
import { Download, Share2 } from "lucide-react";
import type { Candidate } from "@/types";

type ShareKind = "favorite" | "ranking";

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawShareCard(kind: ShareKind, candidates: Candidate[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponible.");

  const background = context.createLinearGradient(0, 0, 1080, 1350);
  background.addColorStop(0, "#17130e");
  background.addColorStop(0.55, "#211b11");
  background.addColorStop(1, "#100f0d");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(213, 176, 102, .55)";
  context.lineWidth = 3;
  roundedRect(context, 38, 38, 1004, 1274, 30);
  context.stroke();
  context.fillStyle = "rgba(211, 174, 101, .08)";
  context.beginPath();
  context.arc(960, 125, 220, 0, Math.PI * 2);
  context.fill();

  context.textAlign = "center";
  context.fillStyle = "#d6b46d";
  context.font = "600 26px Arial, sans-serif";
  context.letterSpacing = "8px";
  context.fillText("MISS PRONO", 540, 145);
  context.letterSpacing = "0px";

  context.fillStyle = "#f2e2bd";
  context.font = "500 58px Georgia, serif";
  context.fillText(kind === "favorite" ? "Mon coup de cœur" : "Mon Top 12", 540, 242);
  context.fillStyle = "rgba(245, 239, 225, .62)";
  context.font = "24px Arial, sans-serif";
  context.fillText("Mon pronostic pour Miss France 2027", 540, 290);

  context.strokeStyle = "rgba(213, 176, 102, .4)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(110, 325);
  context.lineTo(970, 325);
  context.stroke();

  if (kind === "favorite") {
    const candidate = candidates[0];
    context.fillStyle = "#d6b46d";
    context.font = "48px Georgia, serif";
    context.fillText("♛", 540, 555);
    context.fillStyle = "#f2e2bd";
    context.font = candidate.name.length > 22 ? "500 44px Georgia, serif" : "500 54px Georgia, serif";
    context.fillText(candidate.name, 540, 690, 850);
    context.fillStyle = "rgba(245, 239, 225, .66)";
    context.font = "30px Arial, sans-serif";
    context.fillText(`Miss ${candidate.region}`, 540, 750, 850);
    context.fillStyle = "rgba(245, 239, 225, .42)";
    context.font = "22px Arial, sans-serif";
    context.fillText("Ma candidate favorite", 540, 1120);
  } else {
    context.textAlign = "left";
    candidates.forEach((candidate, index) => {
      const y = 390 + index * 68;
      context.fillStyle = index === 0 ? "#d6b46d" : "rgba(214, 180, 109, .72)";
      context.font = "600 25px Arial, sans-serif";
      context.fillText(String(index + 1).padStart(2, "0"), 126, y);
      context.fillStyle = "#f2e2bd";
      context.font = candidate.name.length > 25 ? "26px Georgia, serif" : "30px Georgia, serif";
      context.fillText(candidate.name, 220, y, 550);
      context.textAlign = "right";
      context.fillStyle = "rgba(245, 239, 225, .48)";
      context.font = "20px Arial, sans-serif";
      context.fillText(candidate.region, 954, y, 280);
      context.textAlign = "left";
      if (index < candidates.length - 1) {
        context.strokeStyle = "rgba(255, 255, 255, .09)";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(125, y + 24);
        context.lineTo(955, y + 24);
        context.stroke();
      }
    });
  }

  context.textAlign = "center";
  context.fillStyle = "rgba(245, 239, 225, .35)";
  context.font = "20px Arial, sans-serif";
  context.fillText("missfrance-prono.vercel.app", 540, 1250);
  return canvas;
}

async function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Impossible de créer l’image.")), "image/png");
  });
}

export function PredictionShare({ favorite, ranking, beforeDeadline }: { favorite: Candidate | null; ranking: Candidate[]; beforeDeadline: boolean }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function share(kind: ShareKind) {
    const candidates = kind === "favorite" && favorite ? [favorite] : ranking;
    if (!candidates.length || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const blob = await canvasBlob(drawShareCard(kind, candidates));
      const filename = kind === "favorite" ? "miss-prono-coup-de-coeur.png" : "miss-prono-top-12.png";
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: kind === "favorite" ? "Mon coup de cœur Miss France 2027" : "Mon Top 12 Miss France 2027" });
        setMessage("Carte partagée.");
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        setMessage("Image téléchargée. Tu peux maintenant l’envoyer à tes proches.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setMessage("Partage annulé.");
      } else {
        setMessage("La carte n’a pas pu être créée sur cet appareil.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!favorite && ranking.length === 0) return null;

  return (
    <section className="mt-5 border-t border-white/10 pt-5">
      <button type="button" onClick={() => { setOpen((value) => !value); setMessage(""); }} aria-expanded={open} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gold/30 px-4 text-sm font-semibold text-champagne transition hover:bg-gold/10">
        <Share2 size={16} /> Partager une carte
      </button>
      {open && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs leading-5 text-white/55">La carte est créée sur ton appareil et n’est pas publiée sur ton compte.</p>
          {beforeDeadline && <p className="mt-2 text-xs leading-5 text-amber-100/75">Si tu partages ton Top 12, les personnes qui reçoivent l’image verront tes choix avant la clôture.</p>}
          <div className="mt-3 grid gap-2">
            {favorite && <button type="button" disabled={busy} onClick={() => void share("favorite")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-ivory transition hover:bg-white/[0.06] disabled:opacity-50"><Download size={14} /> {busy ? "Préparation…" : "Partager mon coup de cœur"}</button>}
            {ranking.length === 12 && <button type="button" disabled={busy} onClick={() => void share("ranking")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-gold px-3 text-xs font-semibold text-[#17130c] transition hover:bg-[#ddbd7e] disabled:opacity-50"><Download size={14} /> {busy ? "Préparation…" : "Partager mon Top 12"}</button>}
          </div>
          <p aria-live="polite" className="mt-3 min-h-4 text-xs text-white/50">{message}</p>
        </div>
      )}
    </section>
  );
}
