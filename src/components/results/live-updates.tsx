"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export function LiveUpdates({ editionId, isLive }: { editionId: string; isLive: boolean }) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isLive) return;
    const supabase = createPublicSupabaseClient();
    const refreshInterval = window.setInterval(() => router.refresh(), 30_000);
    if (!supabase) return () => window.clearInterval(refreshInterval);

    const channel = supabase
      .channel(`ceremony-${editionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ceremony_events", filter: `edition_id=eq.${editionId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "league_event_reactions" },
        () => router.refresh(),
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      window.clearInterval(refreshInterval);
      void supabase.removeChannel(channel);
    };
  }, [editionId, isLive, router]);

  if (!isLive) return null;
  return (
    <p aria-live="polite" className="inline-flex items-center gap-2 text-xs text-muted">
      <span className={`size-2 rounded-full ${connected ? "bg-emerald-400" : "bg-gold/70"}`} />
      {connected ? "Direct activé" : "Mise à jour automatique active"}
    </p>
  );
}
