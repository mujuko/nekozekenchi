import { describe, expect, it } from "vitest";
import { createGestureHoldController } from "./gestureHold";

describe("GestureHoldController", () => {
  it("requires the gesture to be held before triggering", () => {
    const controller = createGestureHoldController();

    expect(controller.update("pause", 1000)).toMatchObject({
      started: true,
      triggered: null,
    });
    expect(controller.update("pause", 1500)).toMatchObject({
      progress: 0.5,
      started: false,
    });
    expect(controller.update("pause", 2000).triggered).toBe("pause");
  });

  it("does not restart recognition during a brief detection gap", () => {
    const controller = createGestureHoldController();
    controller.update("resume", 1000);

    expect(controller.update(null, 1200)).toMatchObject({
      candidate: "resume",
      started: false,
    });
    expect(controller.update("resume", 1300).started).toBe(false);
  });

  it("requires a neutral release before the next trigger", () => {
    const controller = createGestureHoldController();
    controller.update("mute", 0);
    expect(controller.update("mute", 800).triggered).toBe("mute");
    expect(controller.update("mute", 1800).triggered).toBeNull();
    controller.update(null, 1900);
    controller.update(null, 2500);
    controller.update("mute", 2600);

    expect(controller.update("mute", 3400).triggered).toBe("mute");
  });
});
