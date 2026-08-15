import { describe, expect, it } from "vitest";
import { DEFAULT_SOUND_CHOICES } from "./soundTypes";

describe("sound defaults", () => {
  it("selects every cat sound by default", () => {
    expect(DEFAULT_SOUND_CHOICES).toEqual(["cat10", "cat11", "cat15", "cat30"]);
  });
});
