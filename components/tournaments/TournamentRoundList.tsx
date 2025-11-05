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
    setEditingRoundIdx(prev => (roundIdx === prev ? null : roundIdx));
  }, []);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [blockHeight, setBlockHeight] = useState<number | undefined>(undefined);

  const fit = useCallback(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const top = Math.max(wrapper.getBoundingClientRect().top, 0);
    const padding = 12; // breathing room so the Add button isn't crushed
    const available = Math.max(window.innerHeight - top - padding, 1);

    const needed = content.scrollHeight;

    const nextScale = Math.min(1, available / Math.max(needed, 1));
    setScale(nextScale > 0 && isFinite(nextScale) ? nextScale : 1);
    setBlockHeight(available); // real layout height to remove the gap below
  }, []);

  // Initial fit + whenever round count changes
  useLayoutEffect(() => {
    fit();
    const id = setTimeout(fit, 0); // catch late fonts/images
    return () => clearTimeout(id);
  }, [fit, props.rounds.length]);

  // Refits on viewport resize and when content height changes (new round, edit, etc.)
  useEffect(() => {
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    const content = contentRef.current;
    const ro = content ? new ResizeObserver(() => fit()) : null;
    if (content && ro) ro.observe(content);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (ro) ro.disconnect();
    };
  }, [fit]);

  return (
    <div
      ref={wrapperRef}
      style={{
        height: blockHeight,              // real space (prevents big gap)
        transform: `scale(${scale})`,     // visual fit
        transformOrigin: "top left",
        width: `${100 / scale}%`,         // keep full width after scaling
        willChange: "transform,height",
      }}
      className="origin-top-left"
    >
      {/* Unscaled content we measure/observe */}
      <div ref={contentRef}>
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
    </div>
  );
}
