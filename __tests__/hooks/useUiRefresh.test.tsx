import { renderHook } from '@testing-library/react';
import { useUiRefresh } from '../../hooks/useUiRefresh';
import { isPostHogConfigured } from '../../lib/posthog';

const mockUseFeatureFlagEnabled = jest.fn();

jest.mock('posthog-js/react', () => ({
  useFeatureFlagEnabled: (...args: unknown[]) => mockUseFeatureFlagEnabled(...args),
}));

jest.mock('../../lib/posthog', () => ({
  UI_REFRESH_FLAG: 'ui-refresh',
  isPostHogConfigured: jest.fn(),
}));

const mockedIsConfigured = isPostHogConfigured as jest.MockedFunction<typeof isPostHogConfigured>;

describe('useUiRefresh', () => {
  afterEach(() => {
    mockUseFeatureFlagEnabled.mockReset();
    mockedIsConfigured.mockReset();
  });

  it('defaults off when NEXT_PUBLIC_POSTHOG_KEY is missing', () => {
    mockedIsConfigured.mockReturnValue(false);
    mockUseFeatureFlagEnabled.mockReturnValue(true);

    const { result } = renderHook(() => useUiRefresh());

    expect(result.current).toEqual({ enabled: false, ready: true });
  });

  it('defaults off when the flag is false', () => {
    mockedIsConfigured.mockReturnValue(true);
    mockUseFeatureFlagEnabled.mockReturnValue(false);

    const { result } = renderHook(() => useUiRefresh());

    expect(result.current).toEqual({ enabled: false, ready: true });
  });

  it('is on only when the flag is true', () => {
    mockedIsConfigured.mockReturnValue(true);
    mockUseFeatureFlagEnabled.mockReturnValue(true);

    const { result } = renderHook(() => useUiRefresh());

    expect(result.current).toEqual({ enabled: true, ready: true });
  });

  it('is not ready until PostHog returns a boolean flag value', () => {
    mockedIsConfigured.mockReturnValue(true);
    mockUseFeatureFlagEnabled.mockReturnValue(undefined);

    const { result } = renderHook(() => useUiRefresh());

    expect(result.current).toEqual({ enabled: false, ready: false });
  });
});
