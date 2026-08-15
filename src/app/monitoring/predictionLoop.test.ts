import { afterEach, describe, expect, it, vi } from "vitest";
import { createPredictionLoop } from "./predictionLoop";
import type { PoseInferenceClient } from "../../platform/pose/poseClient";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("PredictionLoop", () => {
  it("delivers a fresh frame and stops scheduling when inactive", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("document", { hidden: false });
    vi.stubGlobal("window", { setTimeout, clearTimeout });
    vi.stubGlobal(
      "requestAnimationFrame",
      (callback: FrameRequestCallback) =>
        setTimeout(() => callback(performance.now()), 0),
    );
    vi.stubGlobal("cancelAnimationFrame", (handle: number) => {
      clearTimeout(handle);
    });
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({}) as ImageBitmap),
    );

    const result = { poseLandmarks: undefined, hands: [] };
    const client: PoseInferenceClient = {
      close: vi.fn(),
      detectForVideo: vi.fn(async () => result),
    };
    const onResult = vi.fn();
    let active = true;
    onResult.mockImplementation(() => {
      active = false;
    });
    const loop = createPredictionLoop({
      video: { currentTime: 1, readyState: 2 } as HTMLVideoElement,
      getClient: () => client,
      isActive: () => active,
      isPaused: () => false,
      onResult,
      onStale: vi.fn(),
    });

    loop.start();
    await vi.runAllTimersAsync();

    expect(client.detectForVideo).toHaveBeenCalledOnce();
    expect(onResult).toHaveBeenCalledWith(result, expect.any(Number), true);
  });
});
