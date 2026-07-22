import { describe, expect, it } from "vitest";

import { FINAL_ID, RESULTS, slotTeam, withResults } from "./bracket";

describe("completed World Cup bracket", () => {
  it("locks Spain in as champions by default", () => {
    const winners = withResults({});

    expect(RESULTS[FINAL_ID]).toBe("ES");
    expect(slotTeam(winners, FINAL_ID, "a")).toBe("ES");
    expect(slotTeam(winners, FINAL_ID, "b")).toBe("AR");
    expect(winners[FINAL_ID]).toBe("ES");
  });
});
