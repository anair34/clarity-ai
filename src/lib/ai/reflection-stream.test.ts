import { describe, expect, it } from "vitest";
import {
  buildDisplayFromPartialJson,
  buildReflectionUserPrompt,
  extractPartialJsonString,
} from "@/lib/ai/reflection-stream";

describe("extractPartialJsonString", () => {
  it("extracts a complete string value", () => {
    const json = '{"userFacingInsight":"It sounds stressful.","nextPrompt":"What triggered it?"}';
    expect(extractPartialJsonString(json, "userFacingInsight")).toBe(
      "It sounds stressful."
    );
  });

  it("extracts a partial string while JSON is still streaming", () => {
    const json = '{"userFacingInsight":"It sounds str';
    expect(extractPartialJsonString(json, "userFacingInsight")).toBe(
      "It sounds str"
    );
  });

  it("returns an empty string when the key is missing", () => {
    expect(extractPartialJsonString('{"nextPrompt":"Hi"}', "userFacingInsight")).toBe(
      ""
    );
  });
});

describe("buildDisplayFromPartialJson", () => {
  it("joins insight and question when both are available", () => {
    const json =
      '{"userFacingInsight":"You seem tired.","nextPrompt":"What drained you today?"}';
    expect(buildDisplayFromPartialJson(json)).toBe(
      "You seem tired.\n\nWhat drained you today?"
    );
  });

  it("shows the question as it begins streaming", () => {
    const json = '{"userFacingInsight":"You seem tired.","nextPrompt":"What dr';
    expect(buildDisplayFromPartialJson(json)).toBe(
      "You seem tired.\n\nWhat dr"
    );
  });
});

describe("buildReflectionUserPrompt", () => {
  it("includes turn context and memory when provided", () => {
    const prompt = buildReflectionUserPrompt(
      "I'm frustrated again",
      [],
      "[Jun 18, most recent] | Topic: Career | Concern: BCG recruiting",
      {
        turnNumber: 3,
        sessionStartMood: "Frustrated",
        awaitingFeelingCheckIn: false,
      }
    );
    expect(prompt).toContain("Context from past reflections");
    expect(prompt).toContain("BCG recruiting");
    expect(prompt).toContain("Mood at session start");
    expect(prompt).toContain("Frustrated");
    expect(prompt).toContain("I'm frustrated again");
  });

  it("notes when awaiting a feeling-better check-in reply", () => {
    const prompt = buildReflectionUserPrompt(
      "Yeah, a little better",
      [],
      undefined,
      {
        turnNumber: 4,
        sessionStartMood: "Sad",
        awaitingFeelingCheckIn: true,
      }
    );
    expect(prompt).toContain("feeling-better check-in");
  });
});
