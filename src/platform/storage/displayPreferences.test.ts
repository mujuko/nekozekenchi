import { describe, expect, it } from "vitest";
import { createDefaultDisplaySettings } from "./displayPreferences";

describe("display preferences", () => {
  it("uses the product defaults when no preferences are saved", () => {
    expect(createDefaultDisplaySettings()).toEqual({
      video: true,
      poseGuide: false,
      uprightLine: false,
      slouchLine: true,
    });
  });
});
