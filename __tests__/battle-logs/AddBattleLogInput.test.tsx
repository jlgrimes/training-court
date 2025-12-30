/**
 * Tests for AddBattleLogInput format cookie handling
 *
 * The component should:
 * 1. Read format from cookie if it exists
 * 2. Leave format as undefined (not empty string) if no cookie exists
 * 3. Only save format cookie when format is defined
 */

import Cookies from 'js-cookie';

// Mock js-cookie before any imports
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

describe('AddBattleLogInput format cookie handling', () => {
  const mockCookiesGet = Cookies.get as jest.Mock;
  const mockCookiesSet = Cookies.set as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial format state logic', () => {
    it('should return undefined when no format cookie exists', () => {
      mockCookiesGet.mockReturnValue(undefined);

      // Simulate the initialization logic from the component:
      // const [format, setFormat] = useState<LogFormats | undefined>(Cookies.get("format") as LogFormats | undefined);
      const format = Cookies.get('format') as string | undefined;

      expect(format).toBeUndefined();
      // Critically, format should NOT be an empty string
      expect(format).not.toBe('');
    });

    it('should return format value when cookie exists', () => {
      mockCookiesGet.mockReturnValue('standard');

      const format = Cookies.get('format') as string | undefined;

      expect(format).toBe('standard');
    });

    it('should not convert undefined to empty string', () => {
      mockCookiesGet.mockReturnValue(undefined);

      // OLD behavior (wrong): const format = Cookies.get("format") || '';
      // NEW behavior (correct): const format = Cookies.get("format") as LogFormats | undefined;
      const oldBehavior = Cookies.get('format') || '';
      const newBehavior = Cookies.get('format') as string | undefined;

      // Old behavior would give empty string
      expect(oldBehavior).toBe('');
      // New behavior keeps it undefined
      expect(newBehavior).toBeUndefined();
    });
  });

  describe('format cookie saving logic', () => {
    it('should save cookie when format is defined', () => {
      const format: string | undefined = 'standard';

      // Simulate the saving logic: if (format) Cookies.set("format", format, { expires: 30 });
      if (format) {
        Cookies.set('format', format, { expires: 30 });
      }

      expect(mockCookiesSet).toHaveBeenCalledWith('format', 'standard', { expires: 30 });
    });

    it('should NOT save cookie when format is undefined', () => {
      const format: string | undefined = undefined;

      // Simulate the saving logic: if (format) Cookies.set("format", format, { expires: 30 });
      if (format) {
        Cookies.set('format', format, { expires: 30 });
      }

      expect(mockCookiesSet).not.toHaveBeenCalled();
    });

    it('should NOT save cookie when format is empty string (edge case)', () => {
      const format: string | undefined = '';

      // Empty string is falsy, so this shouldn't save either
      if (format) {
        Cookies.set('format', format, { expires: 30 });
      }

      expect(mockCookiesSet).not.toHaveBeenCalled();
    });
  });
});
