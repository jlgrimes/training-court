'use client';

import { Header } from "@/components/ui/header";
import PocketTournamentCreate from "./PocketTournamentCreate";
import { MyPocketTournamentPreviews } from "./Preview/MyPocketTournamentPreviews";
import { SeeMoreButton } from "@/components/SeeMoreButton";
import { TranslatedText } from "@/components/general-translation/TranslatedText";
import { useRecoilValue } from "recoil";
import { userAtom } from "@/app/recoil/atoms/user";

/**
 * Self-contained client widget for Pocket tournaments - can be placed on any page.
 */
export function PocketTournamentsHomePreview() {
  const user = useRecoilValue(userAtom);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-4">
      <Header
        actionButton={<PocketTournamentCreate userId={user.id} />}
      >
        <TranslatedText id="pocket.tournaments.header">Pocket Tournaments</TranslatedText>
      </Header>
      <MyPocketTournamentPreviews
        userId={user.id}
        showFilters={false}
        limit={5}
      />
      <SeeMoreButton href="/pocket/tournaments"/>
    </div>
  );
}
