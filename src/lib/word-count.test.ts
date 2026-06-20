import { describe, expect, it } from "vitest";
import { countWords } from "@/lib/word-count";

describe("countWords", () => {
  it("returns 0 for empty or whitespace-only text", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });

  it("counts words separated by spaces", () => {
    expect(countWords("one two three")).toBe(3);
  });

  it("handles newlines and extra spaces", () => {
    expect(countWords("hello   world\n\ntoday")).toBe(3);
  });
});
