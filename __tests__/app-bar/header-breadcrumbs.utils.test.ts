import {
  formatPlayerVsLabel,
  isUuidSegment,
  matchShareableRoute,
  resolveNamedCrumbLabel,
  shouldShowShareIcon,
} from '../../components/app-bar/header-breadcrumbs.utils';

const tournamentId = '6fa459ea-ee8a-4ca4-894e-db77e160355e';
const logId = '0e37df36-f698-11d6-83a2-0030d04329e5';

describe('header breadcrumb helpers', () => {
  it('detects UUID path segments', () => {
    expect(isUuidSegment(tournamentId)).toBe(true);
    expect(isUuidSegment('Portland Regionals')).toBe(false);
    expect(isUuidSegment('cidebae vs GordinSilva')).toBe(false);
  });

  it('matches tournament and log share routes', () => {
    expect(matchShareableRoute(`/ptcg/tournaments/${tournamentId}`)).toEqual({
      type: 'tournament',
      table: 'tournaments',
      id: tournamentId,
    });
    expect(matchShareableRoute(`/tournaments/${tournamentId}`)).toEqual({
      type: 'tournament',
      table: 'tournaments',
      id: tournamentId,
    });
    expect(matchShareableRoute(`/pocket/tournaments/${tournamentId}`)).toEqual({
      type: 'tournament',
      table: 'pocket_tournaments',
      id: tournamentId,
    });
    expect(matchShareableRoute(`/ptcg/logs/${logId}`)).toEqual({
      type: 'log',
      id: logId,
    });
    expect(matchShareableRoute('/ptcg/logs')).toBeNull();
  });

  it('uses tournament.name instead of a UUID when the refresh is on', () => {
    expect(resolveNamedCrumbLabel({
      uiRefresh: true,
      rawLabel: tournamentId,
      tournamentName: 'Portland Regionals',
    })).toBe('Portland Regionals');
  });

  it('uses {p1} vs {p2} instead of a UUID when the refresh is on', () => {
    expect(resolveNamedCrumbLabel({
      uiRefresh: true,
      rawLabel: logId,
      playerVs: formatPlayerVsLabel('cidebae', 'GordinSilva'),
    })).toBe('cidebae vs GordinSilva');
  });

  it('never falls back to a UUID when the refresh is on and names are missing', () => {
    const label = resolveNamedCrumbLabel({
      uiRefresh: true,
      rawLabel: tournamentId,
    });
    expect(isUuidSegment(label)).toBe(false);
    expect(label).toBe('');
  });

  it('keeps the UUID label when the refresh is off', () => {
    expect(resolveNamedCrumbLabel({
      uiRefresh: false,
      rawLabel: tournamentId,
      tournamentName: 'Portland Regionals',
    })).toBe(tournamentId);
  });

  it('puts the share icon next to the named last segment', () => {
    expect(shouldShowShareIcon({
      uiRefresh: true,
      pathname: `/ptcg/tournaments/${tournamentId}`,
      isLastCrumb: true,
      crumbPath: `/ptcg/tournaments/${tournamentId}`,
      crumbLabel: 'Portland Regionals',
    })).toBe(true);

    expect(shouldShowShareIcon({
      uiRefresh: true,
      pathname: `/ptcg/tournaments/${tournamentId}`,
      isLastCrumb: true,
      crumbPath: '/ptcg/tournaments',
      crumbLabel: 'Tournaments',
    })).toBe(false);
  });
});
