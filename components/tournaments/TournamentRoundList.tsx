'use client';

import { Database } from "@/database.types";
import { TournamentRound } from "./TournamentRound";
import { useCallback, useLayoutEffect, useRef, useState, useEffect } from "react";

interface TournamentRoundListProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  userId: string | undefined;
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
  updateClientRoundsOnEdit: (newRound: Database['public']['Tables']['tournament rounds']['Row']) => void;
  roundsTableName?: string;
  hatType?: string | null;
}

export default function TournamentRoundList(props: TournamentRoundListProps) {
  const [editingRoundIdx, setEditingRoundIdx] = useState<number | null>(null);
  const handleEditingRoundToggle = useCallback((roundIdx: number) => {
    setEditingRoundIdx(prev => (roundIdx === prev ? null : roundIdx));
  }, []);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const anchorDocTopRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [layout, setLayout] = useState<{ scale: number; height?: number }>({
    scale: 1,
    height: undefined,
  });

  const fitNow = useCallback(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    if (anchorDocTopRef.current == null) {
      anchorDocTopRef.current = wrapper.getBoundingClientRect().top + window.scrollY;
    }
    const anchorDocTop = Math.max(anchorDocTopRef.current!, 0);

    const PADDING = 12;
    const available = Math.max(window.innerHeight - anchorDocTop - PADDING, 1);

    const needed = content.scrollHeight;

    if (needed <= available) {
      setLayout({ scale: 1, height: undefined });
      return;
    }

    const ratio = available / needed;
    const scale = clamp(ratio, 0, .9); 
    setLayout({ scale, height: available });
  }, []);

  const fit = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      fitNow();
    });
  }, [fitNow]);

  useLayoutEffect(() => {
    anchorDocTopRef.current = null;
    fitNow();
    const id = requestAnimationFrame(fitNow);
    return () => cancelAnimationFrame(id);
  }, [props.rounds.length, fitNow]);

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
              height,
              transform: `scale(${scale})`,
              width: `${100 / (scale || 1)}%`
            }
          : {}),
        transformOrigin: "top left",
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
              roundsTableName={props.roundsTableName}
              hatType={props.hatType}
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
