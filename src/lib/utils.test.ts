import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges simple class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("deduplicates conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles undefined and null inputs", () => {
    expect(cn(undefined, null, "text-sm")).toBe("text-sm");
  });

  it("merges responsive and hover variants without dropping both", () => {
    const result = cn("hover:bg-muted", "hover:text-foreground");
    expect(result).toContain("hover:bg-muted");
    expect(result).toContain("hover:text-foreground");
  });
});
