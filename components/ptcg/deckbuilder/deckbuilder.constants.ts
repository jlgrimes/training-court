// Keep decklist queries bounded for predictable UI performance. This can become a
// plan-based limit later, but 100 is enough for normal use while avoiding huge selects.
export const MAX_SAVED_DECKLISTS = 100;
