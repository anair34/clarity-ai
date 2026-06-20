import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import {
  countMoods,
  filterSessionsByDays,
  getImprovementLabel,
  getImprovementRate,
  getMostCommon,
  getWeeklyTrend,
} from "@/lib/insights";
import { INITIAL_MOODS } from "@/lib/constants";
import { makeSession } from "@/test/factories";

describe("countMoods", () => {
  it("returns zero counts for an empty session list", () => {
    const counts = countMoods([]);
    for (const mood of INITIAL_MOODS) {
      expect(counts[mood]).toBe(0);
    }
  });

  it("ignores sessions with null initial mood", () => {
    const counts = countMoods([
      makeSession({ initial_mood: null }),
      makeSession({ initial_mood: "Good" }),
    ]);
    expect(counts.Good).toBe(1);
    expect(counts.Great).toBe(0);
  });

  it.each(INITIAL_MOODS)("counts a single %s session", (mood) => {
    const counts = countMoods([makeSession({ initial_mood: mood })]);
    expect(counts[mood]).toBe(1);
  });
});

describe("getMostCommon", () => {
  it("returns an empty array when all values are null", () => {
    expect(getMostCommon([null, undefined, null])).toEqual([]);
  });

  it("sorts ties alphabetically by first seen when counts equal", () => {
    const result = getMostCommon(["Beta", "Alpha", "Beta", "Alpha"]);
    expect(result[0].count).toBe(2);
    expect(result[1].count).toBe(2);
  });

  it("ranks the highest frequency first", () => {
    expect(getMostCommon(["a", "b", "a", "a", "c"])[0]).toEqual({
      value: "a",
      count: 3,
    });
  });

  it("preserves case-sensitive values as distinct entries", () => {
    const result = getMostCommon(["Anxiety", "anxiety", "Anxiety"]);
    expect(result).toHaveLength(2);
  });
});

describe("getImprovementRate", () => {
  it("returns 0 when there are no completed sessions", () => {
    expect(getImprovementRate([])).toBe(0);
    expect(getImprovementRate([makeSession({ final_mood: null })])).toBe(0);
  });

  it("returns 100 when every completed session improved", () => {
    const sessions = [
      makeSession({ final_mood: "Better" }),
      makeSession({ final_mood: "Much better" }),
    ];
    expect(getImprovementRate(sessions)).toBe(100);
  });

  it("returns 0 when no sessions improved", () => {
    const sessions = [
      makeSession({ final_mood: "Worse" }),
      makeSession({ final_mood: "About the same" }),
    ];
    expect(getImprovementRate(sessions)).toBe(0);
  });

  it("rounds to the nearest whole percent", () => {
    const sessions = [
      makeSession({ final_mood: "Better" }),
      makeSession({ final_mood: "Better" }),
      makeSession({ final_mood: "Worse" }),
    ];
    expect(getImprovementRate(sessions)).toBe(67);
  });
});

describe("filterSessionsByDays", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-19T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("includes sessions created today", () => {
    const sessions = [
      makeSession({
        id: "today",
        created_at: "2026-06-19T10:00:00.000Z",
      }),
    ];
    expect(filterSessionsByDays(sessions, 7)).toHaveLength(1);
  });

  it("excludes sessions older than the window", () => {
    const sessions = [
      makeSession({
        id: "old",
        created_at: "2026-05-01T10:00:00.000Z",
      }),
    ];
    expect(filterSessionsByDays(sessions, 7)).toHaveLength(0);
  });

  it("includes sessions exactly on the cutoff day", () => {
    const sessions = [
      makeSession({
        id: "edge",
        created_at: "2026-06-12T12:00:00.000Z",
      }),
    ];
    expect(filterSessionsByDays(sessions, 7)).toHaveLength(1);
  });
});

describe("getWeeklyTrend", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-19T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns an empty trend for no sessions", () => {
    expect(getWeeklyTrend([])).toEqual([]);
  });

  it("excludes sessions without an initial mood", () => {
    const trend = getWeeklyTrend([
      makeSession({ initial_mood: null, created_at: "2026-06-19T10:00:00.000Z" }),
    ]);
    expect(trend).toHaveLength(0);
  });

  it("maps mood to numeric score in trend data", () => {
    const trend = getWeeklyTrend([
      makeSession({
        initial_mood: "Bad",
        created_at: "2026-06-19T10:00:00.000Z",
      }),
    ]);
    expect(trend[0].score).toBe(2);
    expect(trend[0].mood).toBe("Bad");
  });

  it("sorts trend points chronologically", () => {
    const trend = getWeeklyTrend([
      makeSession({
        id: "later",
        initial_mood: "Good",
        created_at: "2026-06-19T10:00:00.000Z",
      }),
      makeSession({
        id: "earlier",
        initial_mood: "Okay",
        created_at: "2026-06-18T10:00:00.000Z",
      }),
    ]);
    expect(trend[0].mood).toBe("Okay");
    expect(trend[1].mood).toBe("Good");
  });
});

describe("getImprovementLabel export", () => {
  it("re-exports improvement labels from constants", () => {
    expect(getImprovementLabel("Bad", "Better")).toBe("Improved");
  });
});
