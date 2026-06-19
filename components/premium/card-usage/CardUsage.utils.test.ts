import { battleLogNewStructure } from "@/components/battle-logs/utils/testing-files/battleLogNewStructure";
import { buildCardUsageStats, extractCardPlayEventsFromLog } from "./CardUsage.utils";
import { CardUsageLogRow } from "./CardUsage.types";

const createRow = (overrides: Partial<CardUsageLogRow> = {}): CardUsageLogRow => ({
  archetype: "Gholdengo",
  created_at: "2024-01-01T00:00:00.000Z",
  decklist_id: "decklist-1",
  format: "SVI-JTG",
  id: "log-1",
  log: battleLogNewStructure,
  opp_archetype: "Greninja",
  result: "W",
  turn_order: "1",
  ...overrides,
});

describe("card usage stats", () => {
  it("extracts played and attached card events for the current user", () => {
    const events = extractCardPlayEventsFromLog(createRow(), "Bassoonboy135");
    const cardNames = events.map((event) => event.cardName);

    expect(cardNames).toContain("Fighting Gong");
    expect(cardNames).toContain("Earthen Vessel");
    expect(cardNames).toContain("Basic Fighting Energy");
  });

  it("counts usage once per game and compares when-played win rate", () => {
    const stats = buildCardUsageStats(
      [
        createRow({ id: "win-1", result: "W" }),
        createRow({
          id: "loss-1",
          result: "L",
          log: battleLogNewStructure.replaceAll("Bassoonboy135 played Fighting Gong.", "Bassoonboy135 drew a card."),
        }),
      ],
      "Bassoonboy135"
    );

    const fightingGong = stats.find((stat) => stat.cardName === "Fighting Gong");

    expect(fightingGong).toMatchObject({
      gamesPlayed: 1,
      totalGames: 2,
      usageRate: 0.5,
      winRateWhenPlayed: 1,
      winRateWhenNotPlayed: 0,
      deltaWinRate: 1,
    });
  });
});
