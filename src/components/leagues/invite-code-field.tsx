"use client";

import { Check, Copy } from "lucide-react";
import { useRef, useState } from "react";

export function InviteCodeField({ code, leagueName }: { code: string; leagueName: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      inputRef.current?.select();
      setCopied(false);
    }
  }

  return (
    <label className="block min-w-44 text-xs text-muted">
      Code d’invitation
      <span className="mt-1.5 flex overflow-hidden rounded-lg border border-gold/20 bg-black/30 focus-within:border-gold/50">
        <input
          ref={inputRef}
          readOnly
          value={code}
          aria-label={`Code d’invitation pour ${leagueName}`}
          onFocus={(event) => event.currentTarget.select()}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-sm tracking-[0.15em] text-gold outline-none"
        />
        <button
          type="button"
          onClick={copyCode}
          aria-label={copied ? "Code copié" : "Copier le code d’invitation"}
          title={copied ? "Code copié" : "Copier le code"}
          className="grid w-10 shrink-0 place-items-center border-l border-white/10 text-muted transition hover:bg-white/[0.06] hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
        >
          {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
        </button>
      </span>
    </label>
  );
}
