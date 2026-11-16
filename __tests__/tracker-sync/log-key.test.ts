/** @jest-environment node */

import { battleLogImportHash, normalizeLogText } from '@/lib/tracker-sync/log-key';

describe('tracker log normalisation', () => {
  it('strips a BOM, converts CRLF and trims line ends', () => {
    expect(normalizeLogText('\uFEFFSetup\r\nBassoonboy135 drew 7 cards.  \r\n\r\n')).toBe(
      'Setup\nBassoonboy135 drew 7 cards.'
    );
  });

  it('hashes the same log the same way across Windows and macOS deliveries', () => {
    const unix = 'Setup\nOyauguru won the coin toss.\nBassoonboy135 wins.\n';
    const windows = 'Setup\r\nOyauguru won the coin toss.\r\nBassoonboy135 wins.\r\n';

    expect(battleLogImportHash(unix)).toBe(battleLogImportHash(windows));
    expect(battleLogImportHash(unix)).toHaveLength(64);
  });

  it('treats different logs as different keys', () => {
    expect(battleLogImportHash('Setup\nA wins.')).not.toBe(battleLogImportHash('Setup\nB wins.'));
  });
});
