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

export default function TournamentRoundList(props: TournamentRoundListProps) {
  const [editingRoundIdx, setEditingRoundIdx] = useState<number | null>(null);
  const handleEditingRoundToggle = useCallback((roundIdx: number) => {
    setEditingRoundIdx(prev => (roundIdx === prev ? null : roundIdx));
  }, []);

  const wrapperRef = useRef<HTMLDivElement>(null);     // scaled host (only when needed)
  const contentRef = useRef<HTMLDivElement>(null);     // unscaled content to measure
  const anchorDocTopRef = useRef<number | null>(null); // document-top anchor (scroll independent)
  const rafRef = useRef<number | null>(null);

  const [layout, setLayout] = useState<{ scale: number; height?: number }>({
    scale: 1,
    height: undefined,
  });

  const fitNow = useCallback(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    // Anchor to page top: element's top in document coords (not affected by current scroll)
    if (anchorDocTopRef.current == null) {
      anchorDocTopRef.current = wrapper.getBoundingClientRect().top + window.scrollY;
    }
    const anchorDocTop = Math.max(anchorDocTopRef.current!, 0);

    const PADDING = 12; // bottom breathing room
    const available = Math.max(window.innerHeight - anchorDocTop - PADDING, 1);

    const needed = content.scrollHeight; // natural (unscaled) height

    if (needed <= available) {
      // Fits naturally → no scale, no fixed height (prevents gaps)
      setLayout({ scale: 1, height: undefined });
      return;
    }

    const ratio = available / needed;
    const scale = clamp(ratio, 0, 1); // add a floor like 0.85 if you want readability
    setLayout({ scale, height: available });
  }, []);

  const fit = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      fitNow();
    });
  }, [fitNow]);

  // Recalc on mount and whenever rounds change count (add/remove)
  useLayoutEffect(() => {
    anchorDocTopRef.current = null; // re-anchor for new structure
    fitNow();                       // immediate pass
    const id = requestAnimationFrame(fitNow); // settle next frame (fonts/layout)
    return () => cancelAnimationFrame(id);
  }, [props.rounds.length, fitNow]);

  // Refit on viewport changes and when content height changes (edit/async content)
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
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fit]);

  const rounds = props.rounds ?? [];
  const { scale, height } = layout;

  return (
    <div
      ref={wrapperRef}
      style={{
        ...(height
          ? {
              height,                         // real layout height (no gap below)
              transform: `scale(${scale})`,   // visual fit
              width: `${100 / (scale || 1)}%` // width compensation
            }
          : {}),
        transformOrigin: "top left",          // resize from the top of the page
      }}
      className="origin-top-left"
    >
      <div ref={contentRef}>
        <div className="grid grid-cols-8">
          <div className="col-span-8 grid grid-cols-8 text-sm font-medium text-muted-foreground px-3 py-1">
            <span className="col-span-2">Round</span>
            <span className="col-span-5">Deck</span>
            <span className="col-span-1 text-right">Result</span>
          </div>

          {rounds.map((round, idx) => (
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

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return n < min ? min : n > max ? max : n;
}
