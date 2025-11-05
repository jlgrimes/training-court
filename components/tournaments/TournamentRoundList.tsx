'use client';

import { Database } from "@/database.types";
import { TournamentRound } from "./TournamentRound";
import { useCallback, useLayoutEffect, useRef, useState, useEffect } from "react";

interface TournamentRoundListProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  userId: string | undefined;
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
  updateClientRoundsOnEdit: (
    newRound: Database['public']['Tables']['tournament rounds']['Row'],
    pos: number
  ) => void;
}

export default function TournamentRoundList (props: TournamentRoundListProps) {
  const [editingRoundIdx, setEditingRoundIdx] = useState<number | null>(null);

  const handleEditingRoundToggle = useCallback((roundIdx: number) => {
    if (roundIdx === editingRoundIdx) return setEditingRoundIdx(null);
    setEditingRoundIdx(roundIdx);
  }, [editingRoundIdx]);

  // ---- FIT TO VIEWPORT (list-only) ----
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const fit = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // available height from the top of this list to bottom of viewport
    const top = el.getBoundingClientRect().top;
    const available = window.innerHeight - top - 32; // -8px breathing room
    const needed = el.scrollHeight;

    const next = Math.min(1, available / Math.max(needed, 1));
    // guard against NaN/zero; cap at 1
    setScale(next > 0 && isFinite(next) ? next : 1);
  }, []);

  useLayoutEffect(() => {
    fit();
    // re-measure after paint (fonts/images)
    const id = setTimeout(fit, 0);
    return () => clearTimeout(id);
  }, [fit, props.rounds.length]);

  useEffect(() => {
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fit]);

  return (
    <div
      ref={wrapperRef}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        // expand width so the scaled content still fills its normal width
        width: `${100 / scale}%`,
        willChange: "transform",
      }}
      className="origin-top-left"
    >
      <div className="grid grid-cols-8">
        <div className="col-span-8 grid grid-cols-8 text-sm font-medium text-muted-foreground px-3 py-1">
          <span className="col-span-2">Round</span>
          <span className="col-span-5">Deck</span>
          <span className="col-span-1 text-right">Result</span>
        </div>

        {props.rounds?.map((round, idx) => (
          <TournamentRound
            key={round.id}
            tournament={props.tournament}
            userId={props.userId}
            round={round}
            updateClientRoundsOnEdit={props.updateClientRoundsOnEdit}
            isEditing={editingRoundIdx === idx}
            handleEditingRoundToggle={() => handleEditingRoundToggle(idx)}
          />
        ))}
      </div>
    </div>
  );
}
