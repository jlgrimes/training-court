import { test, expect } from './fixtures';

/**
 * Real battle log for testing - uses "test" as the player name
 * to match the test user's live_screen_name
 */
const sampleBattleLog = `Setup
test chose tails for the opening coin flip.
testOpp won the coin toss.
testOpp decided to go first.
test drew 7 cards for the opening hand.
- 7 drawn cards.
   • Professor's Research, Double Turbo Energy, Rare Candy, Penny, Boss's Orders, Iono, Fan Rotom
testOpp drew 7 cards for the opening hand.
- 7 drawn cards.
test played Fan Rotom to the Active Spot.
testOpp played Roaring Moon to the Active Spot.

Turn # 1 - testOpp's Turn
testOpp drew a card.
testOpp played Trekking Shoes.
- testOpp moved testOpp's Basic Darkness Energy to the discard pile.
- testOpp drew a card.
testOpp played PokéStop to the Stadium spot.
testOpp played PokéStop.
- testOpp moved testOpp's 3 cards to the discard pile.
   • Explorer's Guidance, Basic Darkness Energy, Basic Darkness Energy
testOpp played Radiant Greninja to the Bench.
testOpp ended their turn.

Turn # 1 - test's Turn
test drew Area Zero Underdepths.
test played Area Zero Underdepths to the Stadium spot.
- testOpp discarded PokéStop.
test played Iono.
- test shuffled their hand.
- test put 5 cards on the bottom of their deck.
   • Penny, Double Turbo Energy, Professor's Research, Boss's Orders, Rare Candy
- testOpp shuffled their hand.
- test moved test's 5 cards to their deck.
- test drew 6 cards.
   • Feather Ball, Duskull, Ultra Ball, Terapagos ex, Terapagos ex, Dusknoir
- test drew 6 cards.
test played Duskull to the Bench.
test's Fan Rotom used Fan Call.
- test drew 3 cards.
   • Hoothoot, Hoothoot, Pidgey
- test shuffled their deck.
test played Hoothoot to the Bench.
test played Hoothoot to the Bench.
test played Pidgey to the Bench.
test ended their turn.

Turn # 2 - testOpp's Turn
testOpp drew a card.
testOpp played Earthen Vessel.
- testOpp discarded Roaring Moon ex.
- testOpp drew 2 cards.
   • Basic Darkness Energy, Basic Darkness Energy
- testOpp shuffled their deck.
testOpp's Radiant Greninja used Concealed Cards.
- testOpp discarded Basic Darkness Energy.
- testOpp drew 2 cards.
testOpp played Roaring Moon to the Bench.
testOpp played Professor Sada's Vitality.
- testOpp attached Basic Darkness Energy to Roaring Moon in the Active Spot.
- testOpp attached Basic Darkness Energy to Roaring Moon on the Bench.
- testOpp drew 3 cards.
testOpp attached Basic Darkness Energy to Roaring Moon in the Active Spot.
testOpp attached Ancient Booster Energy Capsule to Roaring Moon in the Active Spot.
testOpp played Trekking Shoes.
- testOpp drew a card.
testOpp played Earthen Vessel.
- testOpp discarded Explorer's Guidance.
- testOpp drew 2 cards.
   • Basic Darkness Energy, Basic Darkness Energy
- testOpp shuffled their deck.
testOpp's Roaring Moon used Vengeance Fletching on test's Fan Rotom for 130 damage.
test's Fan Rotom was Knocked Out!
test's Pidgey is now in the Active Spot.
testOpp took a Prize card.
A card was added to testOpp's hand.

Turn # 2 - test's Turn
test drew Double Turbo Energy.
test played Terapagos ex to the Bench.
test attached Double Turbo Energy to Terapagos ex on the Bench.
test played Ultra Ball.
- test discarded 2 cards.
   • Terapagos ex, Dusknoir
- test drew Noctowl.
- test shuffled their deck.
test played Feather Ball.
- test drew Pidgeot ex.
- test shuffled their deck.
test evolved Hoothoot to Noctowl on the Bench.
test's Noctowl used Jewel Seeker.
- test drew 2 cards.
   • Professor's Research, Rare Candy
- test shuffled their deck.
test played Rare Candy.
- test evolved Pidgey to Pidgeot ex in the Active Spot.
test played Professor's Research.
- test drew 7 cards.
   • Regieleki, Dusknoir, Noctowl, Night Stretcher, Jacq, Pal Pad, Nest Ball
test's Pidgeot ex used Quick Search.
- test drew Buddy-Buddy Poffin.
- test shuffled their deck.
test played Buddy-Buddy Poffin.
- test drew 2 cards and played them to the Bench.
   • Duskull, Duskull
- test shuffled their deck.
test played Nest Ball.
- test drew Hoothoot and played it to the Bench.
- test shuffled their deck.
test played Night Stretcher.
- test moved test's Terapagos ex to their hand.
test played Terapagos ex to the Bench.
test retreated Pidgeot ex to the Bench.
test's Terapagos ex is now in the Active Spot.
test's Terapagos ex used Unified Beatdown on testOpp's Roaring Moon for 220 damage.
testOpp's Roaring Moon was Knocked Out!
- 3 cards were discarded from testOpp's Roaring Moon.
   • Basic Darkness Energy, Basic Darkness Energy, Ancient Booster Energy Capsule
testOpp's Roaring Moon is now in the Active Spot.
test took a Prize card.
Double Turbo Energy was added to test's hand.

Turn # 3 - testOpp's Turn
testOpp drew a card.
testOpp's Radiant Greninja used Concealed Cards.
- testOpp discarded Basic Darkness Energy.
- testOpp drew 2 cards.
testOpp played Roaring Moon ex to the Bench.
testOpp played Nest Ball.
- testOpp drew Fezandipiti ex and played it to the Bench.
- testOpp shuffled their deck.
testOpp's Fezandipiti ex used Flip the Script.
- testOpp drew 3 cards.
testOpp played PokéStop to the Stadium spot.
- test discarded Area Zero Underdepths.
testOpp played a card.
- test discarded 3 cards.
   • Noctowl, Duskull, Hoothoot
- Hoothoot was discarded from test's Noctowl.
testOpp played PokéStop.
- testOpp moved testOpp's 3 cards to the discard pile.
   • Ultra Ball, Explorer's Guidance, Roaring Moon ex
- testOpp moved testOpp's Ultra Ball to their hand.
testOpp played Professor Sada's Vitality.
- testOpp attached Basic Darkness Energy to Roaring Moon ex on the Bench.
- testOpp attached Basic Darkness Energy to Roaring Moon in the Active Spot.
- testOpp drew 3 cards.
testOpp attached Basic Darkness Energy to Roaring Moon ex on the Bench.
testOpp played Dark Patch.
- testOpp attached Basic Darkness Energy to Roaring Moon ex on the Bench.
testOpp played Nest Ball.
- testOpp drew Pecharunt ex and played it to the Bench.
- testOpp shuffled their deck.
testOpp played Ultra Ball.
- testOpp discarded 2 cards.
   • Ultra Ball, Ultra Ball
- testOpp drew Roaring Moon ex.
- testOpp shuffled their deck.
testOpp played Roaring Moon ex to the Bench.
testOpp played Dark Patch.
- testOpp attached Basic Darkness Energy to Roaring Moon ex on the Bench.
testOpp's Pecharunt ex used Subjugating Chains.
- testOpp's Roaring Moon ex was switched with testOpp's Roaring Moon to become the Active Pokémon.
- testOpp's Roaring Moon ex is now Poisoned.
testOpp's Roaring Moon ex is now in the Active Spot.
testOpp's Roaring Moon ex used Frenzied Gouging.
- testOpp's Roaring Moon ex took 200 damage.
test's Terapagos ex was Knocked Out!
Double Turbo Energy was discarded from test's Terapagos ex.
test's Pidgeot ex is now in the Active Spot.
testOpp took 2 Prize cards.
A card was added to testOpp's hand.
A card was added to testOpp's hand.

Pokémon Checkup
1 damage counter was placed on testOpp's Roaring Moon ex for the Special Condition Poisoned.

Turn # 3 - test's Turn
test drew Fan Rotom.
test played PokéStop.
- testOpp moved testOpp's 3 cards to the discard pile.
   • Noctowl, Terapagos ex, Nest Ball
- testOpp moved testOpp's Nest Ball to their hand.
test played Nest Ball.
- test drew Fezandipiti ex and played it to the Bench.
- test shuffled their deck.
test's Fezandipiti ex used Flip the Script.
- test drew 3 cards.
   • Terapagos ex, Penny, Counter Catcher
test evolved Hoothoot to Noctowl on the Bench.
test's Noctowl used Jewel Seeker.
- test drew 2 cards.
   • Area Zero Underdepths, Briar
- test shuffled their deck.
test's Pidgeot ex used Quick Search.
- test drew Rare Candy.
- test shuffled their deck.
test played Rare Candy.
- test evolved Duskull to Dusknoir on the Bench.
test played Counter Catcher.
- testOpp's Pecharunt ex was switched with testOpp's Roaring Moon ex to become the Active Pokémon.
testOpp's Pecharunt ex is now in the Active Spot.
test's Dusknoir used Cursed Blast.
- test put 13 damage counters on test's Roaring Moon ex.
testOpp's Roaring Moon ex was Knocked Out!
- 3 cards were discarded from testOpp's Roaring Moon ex.
   • Basic Darkness Energy, Basic Darkness Energy, Basic Darkness Energy
test's Dusknoir was Knocked Out!
Duskull was discarded from test's Dusknoir.
testOpp took a Prize card.
test took 2 Prize cards.
A card was added to testOpp's hand.
Night Stretcher was added to test's hand.
Nest Ball was added to test's hand.
test played Area Zero Underdepths to the Stadium spot.
- testOpp discarded PokéStop.
test attached Double Turbo Energy to Terapagos ex on the Bench.
test played Briar.
test played Terapagos ex to the Bench.
test played Fan Rotom to the Bench.
test played Nest Ball.
- test shuffled their deck.
test played Night Stretcher.
- test moved test's Hoothoot to their hand.
test played Hoothoot to the Bench.
test retreated Pidgeot ex to the Bench.
test's Terapagos ex is now in the Active Spot.
test's Terapagos ex used Unified Beatdown on testOpp's Pecharunt ex for 190 damage.
testOpp's Pecharunt ex was Knocked Out!
test took 3 Prize cards.
Buddy-Buddy Poffin was added to test's hand.
Hoothoot was added to test's hand.
Bloodmoon Ursaluna ex was added to test's hand.
All Prize cards taken. test wins.`;

test.describe('Battle Log Paste Flow', () => {
  // Auth is handled by storageState (from auth.setup.ts)
  // Client-side DB writes are mocked by the fixture

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show review dialog when pasting a battle log', async ({ page }) => {
    const textarea = page.getByPlaceholder('Paste PTCGL log here');
    await expect(textarea).toBeVisible({ timeout: 10000 });

    // Write to clipboard and click Add Log button
    await page.evaluate((log) => navigator.clipboard.writeText(log), sampleBattleLog);
    await page.getByRole('button', { name: /Add Log/i }).click();

    // Verify the review dialog appears
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Review Battle Log')).toBeVisible();
  });

  test('should update UI after confirming battle log', async ({ page }) => {
    const textarea = page.getByPlaceholder('Paste PTCGL log here');
    await expect(textarea).toBeVisible({ timeout: 10000 });

    await page.evaluate((log) => navigator.clipboard.writeText(log), sampleBattleLog);
    await page.getByRole('button', { name: /Add Log/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Click confirm button
    await dialog.getByRole('button', { name: 'Confirm' }).click();

    // Verify success toast appears (mocked API returns success)
    // Use .first() because the toast text appears in multiple elements
    await expect(page.getByText('Battle log successfully imported!').first()).toBeVisible({ timeout: 10000 });

    // Dialog should close
    await expect(dialog).not.toBeVisible();

    // Textarea should be cleared
    await expect(textarea).toHaveValue('');
  });

  test('should show error toast for invalid battle log', async ({ page }) => {
    const textarea = page.getByPlaceholder('Paste PTCGL log here');
    await expect(textarea).toBeVisible({ timeout: 10000 });

    // Write invalid log to clipboard and click Add Log
    await page.evaluate(() => navigator.clipboard.writeText('This is not a valid battle log'));
    await page.getByRole('button', { name: /Add Log/i }).click();

    // Verify error toast appears (parsing fails before API is called)
    // The button click path shows "Failed to parse clipboard contents"
    await expect(page.getByText('Failed to parse clipboard contents').first()).toBeVisible({ timeout: 5000 });
  });

  test('should clear input when X button is clicked', async ({ page }) => {
    const textarea = page.getByPlaceholder('Paste PTCGL log here');
    await expect(textarea).toBeVisible({ timeout: 10000 });

    await textarea.fill('Some text');
    await expect(textarea).toHaveValue('Some text');

    // The X button appears when there's text
    const clearButton = page.locator('button').filter({ has: page.locator('svg.lucide-x') });
    await clearButton.click();

    await expect(textarea).toHaveValue('');
  });

  test('should show result in review dialog', async ({ page }) => {
    const textarea = page.getByPlaceholder('Paste PTCGL log here');
    await expect(textarea).toBeVisible({ timeout: 10000 });

    await page.evaluate((log) => navigator.clipboard.writeText(log), sampleBattleLog);
    await page.getByRole('button', { name: /Add Log/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // The result should show the user won (test wins in the sample log)
    await expect(dialog.getByText(/Result:.*W/i)).toBeVisible();
  });
});

test.describe('Public Pages', () => {
  test('home page loads without errors', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Training Court/i);
  });
});
