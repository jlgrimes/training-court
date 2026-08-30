import { getLoggedOutHomeState } from '../../lib/ui-refresh';

describe('logged-out home empty state', () => {
  it('waits while auth or the feature flag is still loading', () => {
    expect(getLoggedOutHomeState({
      authLoading: true,
      isLoggedIn: false,
      uiRefreshReady: true,
      uiRefreshEnabled: true,
    })).toBe('wait');

    expect(getLoggedOutHomeState({
      authLoading: false,
      isLoggedIn: false,
      uiRefreshReady: false,
      uiRefreshEnabled: false,
    })).toBe('wait');
  });

  it('renders the existing landing in the app shell when ui-refresh is on', () => {
    expect(getLoggedOutHomeState({
      authLoading: false,
      isLoggedIn: false,
      uiRefreshReady: true,
      uiRefreshEnabled: true,
    })).toBe('landing');
  });

  it('keeps sending logged-out visitors to login when the flag is off', () => {
    expect(getLoggedOutHomeState({
      authLoading: false,
      isLoggedIn: false,
      uiRefreshReady: true,
      uiRefreshEnabled: false,
    })).toBe('redirect');
  });

  it('shows the logged-in home when a user is present', () => {
    expect(getLoggedOutHomeState({
      authLoading: false,
      isLoggedIn: true,
      uiRefreshReady: true,
      uiRefreshEnabled: true,
    })).toBe('app');
  });
});
