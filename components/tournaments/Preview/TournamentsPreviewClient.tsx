"use client";

import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import TournamentPreview from "../Preview/TournamentPreview";
import { Database } from "@/database.types";
import { getTournamentRoundsFromUserRounds } from "../utils/tournaments.utils";
import { tournamentsState } from "@/components/atoms/tournamentAtoms";

interface TournamentsPreviewClientProps {
  tournamentData: Database['public']['Tables']['tournaments']['Row'][];
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
}

export const TournamentsPreviewClient = ({ tournamentData, rounds }: TournamentsPreviewClientProps) => {
  const setTournaments = useSetRecoilState(tournamentsState);

  useEffect(() => {
    setTournaments(tournamentData);
  }, [tournamentData, setTournaments]);

  return (
    <div className="flex flex-col gap-2">
      {tournamentData.map((tournament) => (
        <TournamentPreview
          key={tournament.id}
          tournament={tournament}
          rounds={getTournamentRoundsFromUserRounds(rounds, tournament)}
        />
      ))}
    </div>
  );
};
