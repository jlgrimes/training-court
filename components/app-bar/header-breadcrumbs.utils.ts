export const UUID_SEGMENT_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidSegment(segment: string): boolean {
  return UUID_SEGMENT_RE.test(segment);
}

export type ShareableRoute =
  | { type: 'tournament'; table: 'tournaments' | 'pocket_tournaments'; id: string }
  | { type: 'log'; id: string };

export function matchShareableRoute(pathname: string): ShareableRoute | null {
  const pocketTournament = pathname.match(/^\/pocket\/tournaments\/([^/]+)\/?$/);
  if (pocketTournament) {
    return { type: 'tournament', table: 'pocket_tournaments', id: pocketTournament[1] };
  }

  const ptcgTournament = pathname.match(/^\/(?:ptcg\/)?tournaments\/([^/]+)\/?$/);
  if (ptcgTournament) {
    return { type: 'tournament', table: 'tournaments', id: ptcgTournament[1] };
  }

  const log = pathname.match(/^\/(?:ptcg\/)?logs\/([^/]+)\/?$/);
  if (log) {
    return { type: 'log', id: log[1] };
  }

  return null;
}

export function formatPlayerVsLabel(player1?: string | null, player2?: string | null): string | null {
  if (!player1 || !player2) return null;
  return `${player1} vs ${player2}`;
}

export function resolveNamedCrumbLabel(params: {
  uiRefresh: boolean;
  rawLabel: string;
  tournamentName?: string | null;
  playerVs?: string | null;
}): string {
  if (!params.uiRefresh) return params.rawLabel;
  if (!isUuidSegment(params.rawLabel)) return params.rawLabel;
  return params.tournamentName || params.playerVs || '';
}

export function shouldShowShareIcon(params: {
  uiRefresh: boolean;
  pathname: string;
  isLastCrumb: boolean;
  crumbPath: string;
  crumbLabel: string;
}): boolean {
  if (!params.isLastCrumb) return false;
  if (params.uiRefresh) {
    return (
      matchShareableRoute(params.pathname) !== null &&
      params.crumbPath === params.pathname &&
      Boolean(params.crumbLabel) &&
      !isUuidSegment(params.crumbLabel)
    );
  }
  return /\d/.test(params.pathname);
}
