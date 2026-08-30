export type LoggedOutHomeState = 'wait' | 'landing' | 'redirect' | 'app';

export function getLoggedOutHomeState(params: {
  authLoading: boolean;
  isLoggedIn: boolean;
  uiRefreshReady: boolean;
  uiRefreshEnabled: boolean;
}): LoggedOutHomeState {
  if (params.authLoading) return 'wait';
  if (params.isLoggedIn) return 'app';
  if (!params.uiRefreshReady) return 'wait';
  return params.uiRefreshEnabled ? 'landing' : 'redirect';
}
