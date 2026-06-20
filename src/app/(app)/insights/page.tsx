import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MoodChart } from "@/components/insights/mood-chart";
import {
  countMoods,
  filterSessionsByDays,
  getImprovementLabel,
  getImprovementRate,
  getMostCommon,
  getWeeklyTrend,
} from "@/lib/insights";
import { MOOD_COLORS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { InitialMood, ReflectionSession } from "@/lib/types";
import { cn } from "@/lib/utils";

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description?: string;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl font-semibold">{value}</CardTitle>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      )}
    </Card>
  );
}

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("reflection_sessions")
    .select("*")
    .order("created_at", { ascending: false });

  const allSessions = (sessions ?? []) as ReflectionSession[];
  const weekSessions = filterSessionsByDays(allSessions, 7);
  const monthSessions = filterSessionsByDays(allSessions, 30);
  const weekMoodCounts = countMoods(weekSessions);
  const improvementRate = getImprovementRate(allSessions);
  const commonEmotions = getMostCommon(allSessions.map((s) => s.primary_emotion));
  const commonTopics = getMostCommon(allSessions.map((s) => s.topic));
  const weeklyTrend = getWeeklyTrend(allSessions);

  if (allSessions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Insights
        </h1>
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>No reflections yet</CardTitle>
            <CardDescription>
              Complete your first reflection to see mood trends, common emotions,
              and whether writing is helping you feel better.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Insights
        </h1>
        <p className="text-muted-foreground">
          How you&apos;ve been feeling recently, and whether reflection is
          helping.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total sessions" value={allSessions.length} />
        <StatCard
          title="Improvement rate"
          value={`${improvementRate}%`}
          description="Sessions where you felt better afterward"
        />
        <StatCard
          title="This week"
          value={weekSessions.length}
          description="Reflection sessions in the last 7 days"
        />
        <StatCard
          title="Top emotion"
          value={commonEmotions[0]?.value ?? "—"}
          description={
            commonEmotions[0]
              ? `${commonEmotions[0].count} sessions`
              : undefined
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MoodChart data={weeklyTrend} />

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Mood breakdown (7 days)</CardTitle>
            <CardDescription>Starting moods from recent sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["Great", "Good", "Okay", "Bad", "Terrible"] as InitialMood[]).map(
              (mood) => (
                <div key={mood} className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={cn("border", MOOD_COLORS[mood])}
                  >
                    {mood}
                  </Badge>
                  <span className="text-sm font-medium">
                    {weekMoodCounts[mood]} days
                  </span>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Most common emotions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {commonEmotions.slice(0, 5).map(({ value, count }) => (
              <div key={value} className="flex justify-between text-sm">
                <span className="capitalize">{value}</span>
                <span className="text-muted-foreground">{count} sessions</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Most common topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {commonTopics.slice(0, 5).map(({ value, count }) => (
              <div key={value} className="flex justify-between text-sm">
                <span className="capitalize">{value}</span>
                <span className="text-muted-foreground">{count} sessions</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Recent reflections</CardTitle>
          <CardDescription>
            {monthSessions.length} sessions in the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allSessions.slice(0, 10).map((session) => {
            const improvement = getImprovementLabel(
              session.initial_mood as InitialMood,
              session.final_mood
            );

            return (
              <div
                key={session.id}
                className="rounded-xl border border-border/60 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(session.created_at), "MMM d, yyyy")}
                  </span>
                  {session.initial_mood && (
                    <Badge variant="outline" className="text-xs">
                      Started: {session.initial_mood}
                    </Badge>
                  )}
                  {session.final_mood && (
                    <Badge variant="outline" className="text-xs">
                      Ended: {session.final_mood}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      improvement === "Improved" &&
                        "border-emerald-200 bg-emerald-50 text-emerald-700",
                      improvement === "Worse" &&
                        "border-rose-200 bg-rose-50 text-rose-700"
                    )}
                  >
                    {improvement}
                  </Badge>
                </div>
                {session.primary_emotion && (
                  <p className="mt-2 text-sm">
                    <span className="font-medium capitalize">
                      {session.primary_emotion}
                    </span>
                    {session.topic && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {session.topic}
                      </span>
                    )}
                  </p>
                )}
                {session.summary && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {session.summary}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
