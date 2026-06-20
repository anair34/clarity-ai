"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InitialMood } from "@/lib/types";

interface MoodChartProps {
  data: { date: string; score: number; mood: InitialMood }[];
}

export function MoodChart({ data }: MoodChartProps) {
  if (data.length === 0) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Weekly mood trend</CardTitle>
          <CardDescription>Complete a reflection to see your trend.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Weekly mood trend</CardTitle>
        <CardDescription>Starting mood from your recent sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, _name, item) => [
                  item.payload.mood,
                  "Starting mood",
                ]}
              />
              <Bar dataKey="score" fill="oklch(0.48 0.08 230)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
