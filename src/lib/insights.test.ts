import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import {
  countMoods,
  filterSessionsByDays,
  getImprovementLabel,
  getImprovementRate,
  getMostCommon,
  getWeeklyTrend,
} from "@/lib/insights";
import { DETECTED_MOODS } from "@/lib/constants";
import { makeSession } from "@/test/factories";

describe("countMoods", () => {
  it("returns zero counts for an empty session list", () => {
    const counts = countMoods([]);
    for (const mood of DETECTED_MOODS) {
      expect(counts[mood]).toBe(0);
    }
  });

  it("ignores sessions with null initial mood", () => {
    const counts = countMoods([
      makeSession({ initial_mood: null }),
      makeSession({ initial_mood: "Happy" }),
    ]);
    expect(counts.Happy).toBe(1);
    expect(counts.Sad).toBe(0);
  });

  it.each(DETECTED_MOODS)("counts a single %s session", (mood) => {
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
      makeSession({ initial_mood: "Sad", final_mood: "Happy" }),
      makeSession({ initial_mood: "Angry", final_mood: "Happy" }),
    ];
    expect(getImprovementRate(sessions)).toBe(100);
  });

  it("returns 0 when no sessions improved", () => {
    const sessions = [
      makeSession({ initial_mood: "Happy", final_mood: "Sad" }),
      makeSession({ initial_mood: "Frustrated", final_mood: "Angry" }),
    ];
    expect(getImprovementRate(sessions)).toBe(0);
  });

  it("rounds to the nearest whole percent", () => {
    const sessions = [
      makeSession({ initial_mood: "Sad", final_mood: "Happy" }),
      makeSession({ initial_mood: "Angry", final_mood: "Happy" }),
      makeSession({ initial_mood: "Happy", final_mood: "Sad" }),
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
        initial_mood: "Sad",
        created_at: "2026-06-19T10:00:00.000Z",
      }),
    ]);
    expect(trend[0].score).toBe(1);
    expect(trend[0].mood).toBe("Sad");
  });

  it("sorts trend points chronologically", () => {
    const trend = getWeeklyTrend([
      makeSession({
        id: "later",
        initial_mood: "Happy",
        created_at: "2026-06-19T10:00:00.000Z",
      }),
      makeSession({
        id: "earlier",
        initial_mood: "Frustrated",
        created_at: "2026-06-18T10:00:00.000Z",
      }),
    ]);
    expect(trend[0].mood).toBe("Frustrated");
    expect(trend[1].mood).toBe("Happy");
  });
});

describe("getImprovementLabel export", () => {
  it("re-exports improvement labels from constants", () => {
    expect(getImprovementLabel("Sad", "Happy")).toBe("Improved");
  });
});
