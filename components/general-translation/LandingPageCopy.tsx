'use client';

import { T } from 'gt-react';
import { CardDescription } from '@/components/ui/card';

export function LandingBattleLogsCopy() {
  return (
    <div className="flex flex-col gap-4">
      <T id="landing.battleLogs.title">
        <h2 className="font-semibold text-2xl">Battle Logs</h2>
      </T>
      <T id="landing.battleLogs.description">
        <p>
          Display your PTCG Live battle logs in a beautiful UI - all you have to
          do is Copy Paste. Training Court gives you a preview of each of your
          battles - all can be sorted by deck or day. Additionally, you can
          interact with a turn-by-turn breakdown of your battles, including
          prize maps and other key actions each turn.
        </p>
      </T>
    </div>
  );
}

export function LandingTournamentsCopy() {
  return (
    <div className="flex flex-col gap-4">
      <T id="landing.tournaments.title">
        <h2 className="font-semibold text-2xl">Tournaments</h2>
      </T>
      <T id="landing.tournaments.description">
        <p>
          Keep full record of your IRL Pokemon tournaments - from league cups,
          to regionals, to international championships. Share tournament runs
          with your friends so they can keep up with the action at home.
        </p>
      </T>
    </div>
  );
}

export function LandingFooterCopy() {
  return (
    <T id="landing.footer.credits">
      <CardDescription>Made by Jared Grimes and JW Kriewall</CardDescription>
    </T>
  );
}
