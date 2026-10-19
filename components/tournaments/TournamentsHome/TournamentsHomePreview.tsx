'use client';

import { DataLoadError } from '@/components/ui/data-load-error';

import { DataLoadingSkeleton } from "@/components/ui/data-loading-skeleton";

import TournamentPreview from "../Preview/TournamentPreview";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { SeeMoreButton } from "@/components/SeeMoreButton";
import { PTCG_TOURNAMENT_CONFIG } from "../utils/tournament-game-config";
import { Header } from "@/components/ui/header";
import TournamentCreateDialog from "../TournamentCreate";
import { TranslatedText } from "@/components/general-translation/TranslatedText";
import { useRecoilValue } from "recoil";
import { userAtom } from "@/app/recoil/atoms/user";
import { useTournaments } from "@/hooks/tournaments/useTournaments";

/**
 * Self-contained client widget for tournaments - can be placed on any page.
 */
export function TournamentsHomePreview() {
  const user = useRecoilValue(userAtom);
  const { data: tournaments, isLoading: tournamentsLoading, error } = useTournaments(user?.id, 5);

  if (error && !tournaments) return <DataLoadError />;
  if (!user || (tournamentsLoading && !tournaments)) return <DataLoadingSkeleton />;

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Header
          actionButton={<TournamentCreateDialog userId={user.id} config={PTCG_TOURNAMENT_CONFIG} />}
        ><TranslatedText id="tournaments.ptcgHeader">PTCG Tournaments</TranslatedText></Header>
        <Card className="border-none">
          <CardHeader className="px-2">
            <CardDescription><TranslatedText id="tournaments.empty.description">You can add tournaments from the past, present, or future.</TranslatedText></CardDescription>
            <CardDescription><TranslatedText id="tournaments.empty.cta">Click New Tournament to get started!</TranslatedText></CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-6">
        <Header
          actionButton={<TournamentCreateDialog userId={user.id} config={PTCG_TOURNAMENT_CONFIG} />}
        ><TranslatedText id="tournaments.ptcgHeader">PTCG Tournaments</TranslatedText></Header>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {tournaments.map((tournament) => (
              <TournamentPreview
                tournament={tournament}
                key={tournament.id}
                record={tournament}
                basePath={PTCG_TOURNAMENT_CONFIG.basePath}
              />
            ))}
          </div>
          <SeeMoreButton href={PTCG_TOURNAMENT_CONFIG.basePath} />
        </div>
      </div>
    </div>
  );
}
