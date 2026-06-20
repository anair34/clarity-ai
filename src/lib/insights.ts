import {
  getImprovementLabel,
  DETECTED_MOODS,
  isImproved,
} from "@/lib/constants";
import { getMoodScore } from "@/lib/moods";
import type { DetectedMood, ReflectionSession } from "@/lib/types";

export function countMoods(sessions: ReflectionSession[]) {
  const counts = Object.fromEntries(
    DETECTED_MOODS.map((mood) => [mood, 0])
  ) as Record<DetectedMood, number>;

  for (const session of sessions) {
    const mood = session.initial_mood;
    if (mood && counts[mood as DetectedMood] !== undefined) {
      counts[mood as DetectedMood] += 1;
    }
  }

  return counts;
}

export function getMostCommon(
  values: (string | null | undefined)[]
): { value: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export function getImprovementRate(sessions: ReflectionSession[]): number {
  const completed = sessions.filter((s) => s.initial_mood && s.final_mood);
  if (completed.length === 0) return 0;

  const improved = completed.filter((s) =>
    isImproved(s.initial_mood, s.final_mood)
  ).length;
  return Math.round((improved / completed.length) * 100);
}

export function getWeeklyTrend(sessions: ReflectionSession[]) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recent = sessions
    .filter((s) => s.initial_mood && new Date(s.created_at) >= sevenDaysAgo)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  return recent.map((session) => {
    const date = new Date(session.created_at);
    const mood = session.initial_mood as DetectedMood;
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      }),
      score: getMoodScore(mood),
      mood,
    };
  });
}

export function filterSessionsByDays(
  sessions: ReflectionSession[],
  days: number
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return sessions.filter((s) => new Date(s.created_at) >= cutoff);
}

export { getImprovementLabel };
