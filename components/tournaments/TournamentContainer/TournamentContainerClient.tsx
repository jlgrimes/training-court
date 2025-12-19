'use client';

import { Database } from "@/database.types"
import TournamentRoundList from "../TournamentRoundList";
import { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { EditableTournamentArchetype } from "@/components/archetype/AddArchetype/AddTournamentArchetype";
import { displayTournamentDate, getRecord } from "../utils/tournaments.utils";
import AddTournamentRound from "../AddTournamentRound/AddTournamentRound";
import { TournamentEditDialog } from "./TournamentEditDialog";
import { DateRange } from "react-day-picker";
import { parseISO } from "date-fns";
import { TournamentDeleteDialog } from "./TournamentDeleteDialog";
import { TournamentCategoryBadge } from "../Category/TournamentCategoryBadge";
import { TournamentCategory } from "../Category/tournament-category.types";
import { TournamentPlacement } from "../Placement/tournament-placement.types";
import { TournamentPlacementBadge } from "../Placement/TournamentPlacementBadge";
import { preload } from "swr";
import { USE_LIMITLESS_SPRITES_KEY } from "@/components/archetype/sprites/sprites.constants";
import { fetchLimitlessSprites } from "@/components/archetype/sprites/sprites.utils";
import { TournamentFormatBadge } from "../Format/tournamentFormatBadge";
import { TournamentNotesDialog } from "./TournamentNotesDialog";
import { TournamentGameConfig } from "../utils/tournament-game-config";
import { isPremiumUser } from "@/components/premium/premium.utils";
import { HatEditDialog } from "@/components/hats/HatEditDialog";

interface TournamentContainerClientProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
  user: User | undefined | null;
  config: TournamentGameConfig;
}

export const TournamentContainerClient = (props: TournamentContainerClientProps) => {
  const config = props.config;
  const [rounds, setRounds] = useState(props.rounds);
  const [tournamentName, setTournamentName] = useState(props.tournament.name);
  // @TODO: Date is still shifting for some people. When they save, the date adjusts to an unexpected date. This needs to be fixed
  const [tournamentDate, setTournamentDate] = useState<DateRange>({ from: parseISO( props.tournament.date_from), to: parseISO(props.tournament.date_to + "T00:00:00Z") });
  const [tournamentCategory, setTournamentCategory] = useState<TournamentCategory | null>(props.tournament.category as TournamentCategory | null);
  const [tournamentPlacement, setTournamentPlacement] = useState<TournamentPlacement | null>(props.tournament.placement as TournamentPlacement | null);
  const [tournamentFormat, setTournamentFormat] = useState<string | null>(props.tournament.format);
  const [hatType, setHatType] = useState<string | null>(props.tournament.hat_type ?? null);
  const [tournamentNotes, setTournamentNotes] = useState(props.tournament.notes);
  const prevLenRef = useRef<number>(props.rounds.length);

  useEffect(() => {
    const prev = prevLenRef.current;
    const curr = rounds.length;

    if (curr > prev) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
    prevLenRef.current = curr;
  }, [rounds.length]);

  useEffect(() => {
    preload(USE_LIMITLESS_SPRITES_KEY, fetchLimitlessSprites);
  }, []);

  const updateClientRoundsOnAdd = useCallback((newRound: Database['public']['Tables']['tournament rounds']['Row']) => {
    setRounds([...rounds, newRound]);
  }, [setRounds, rounds]);

  const updateClientRoundsOnEdit = useCallback((newRound: Database['public']['Tables']['tournament rounds']['Row'], pos: number) => {
    let newRounds = [...rounds];
    newRounds[pos] = newRound;
    
    setRounds(newRounds);
  }, [setRounds, rounds]);

  const updateClientTournamentDataOnEdit = useCallback((newName: string, newDate: DateRange, newCategory: TournamentCategory | null, newPlacement: TournamentPlacement | null, newFormat: string | null) => {
    setTournamentDate(newDate);
    setTournamentName(newName);
    setTournamentCategory(newCategory);
    setTournamentPlacement(newPlacement);
    setTournamentFormat(newFormat);
  }, []);

  const handleHatChange = useCallback(async (nextHat: string | null) => {
    setHatType(nextHat);
    const supabase = (await import("@/utils/supabase/client")).createClient();
    const { error } = await supabase
      .from(config.tournamentsTable as any)
      .update({ hat_type: nextHat })
      .eq('id', props.tournament.id);
    if (error) {
      setHatType(props.tournament.hat_type ?? null);
      throw error;
    }
  }, [config.tournamentsTable, props.tournament.hat_type, props.tournament.id]);

  return (
    <div className="w-full flex justify-center px-4 sm:px-8">
      <div className="w-full max-w-xl flex flex-col flex-1 gap-2">
        <div className="flex flex-col gap-1">
          {props.user?.id === props.tournament.user && (
            <div className="flex items-center gap-2">
              <TournamentEditDialog
                tournamentId={props.tournament.id}
                tournamentName={tournamentName}
                tournamentDateRange={{
                  from: parseISO(props.tournament.date_from),
                  to: parseISO(props.tournament.date_to),
                }}
                tournamentCategory={tournamentCategory}
                tournamentPlacement={tournamentPlacement}
                tournamentFormat={tournamentFormat}
                user={props.user}
                updateClientTournament={updateClientTournamentDataOnEdit}
                config={config}
                formats={config.formats}
              />
              
              <TournamentNotesDialog
                tournamentId={props.tournament.id} 
                tournamentNotes={tournamentNotes}
                tournamentName={tournamentName}
                config={config}
              />
              {/* {isPremiumUser(props.user?.id) && ( */}
                <HatEditDialog
                  tournamentName={tournamentName}
                  currentHat={hatType}
                  onChange={handleHatChange}
                />
              {/* )} */}
              <TournamentDeleteDialog
                tournamentId={props.tournament.id}
                tournamentName={tournamentName}
                config={config}
              />
            </div>
          )}
  
          <div className="flex flex-col gap-1 sm:gap-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-col min-w-0 flex-1">
                <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">
                  {tournamentName}
                </h1>
                <h3 className="text-sm text-muted-foreground">
                  {displayTournamentDate(props.tournament.date_from, props.tournament.date_to)}
                </h3>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {tournamentCategory && <TournamentCategoryBadge category={tournamentCategory} />}
                  {tournamentPlacement && <TournamentPlacementBadge placement={tournamentPlacement} />}
                  {tournamentFormat && <TournamentFormatBadge format={tournamentFormat as any} />}
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">
                  {getRecord(rounds)}
                </h1>
                <EditableTournamentArchetype
                  tournament={props.tournament}
                  tableName={config.tournamentsTable}
                  hatType={hatType}
                  editDisabled={props.tournament.user !== props.user?.id}
                />
              </div>
            </div>
          </div>

  
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <TournamentRoundList
                tournament={props.tournament}
                userId={props.user?.id}
                rounds={rounds}
                updateClientRoundsOnEdit={updateClientRoundsOnEdit}
                roundsTableName={config.roundsTable}
                hatType={hatType}
              />
              {props.user?.id === props.tournament.user && (
                <AddTournamentRound
                  tournamentId={props.tournament.id}
                  userId={props.user.id}
                  editedRoundNumber={rounds.length + 1}
                  updateClientRounds={updateClientRoundsOnAdd}
                  roundsTableName={config.roundsTable}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );  
}





