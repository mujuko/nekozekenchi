import { describe, expect, it } from "vitest";
import { detectGestureCommand } from "./detectGesture";
import type { DetectedHand, Landmark } from "./types";

describe("detectGestureCommand", () => {
  it("maps the canned Open_Palm gesture to stop", () => {
    expect(detectGestureCommand(undefined, [hand("Open_Palm", 0.9)])).toBe(
      "stop",
    );
  });

  it("maps the canned Victory gesture to resume", () => {
    expect(detectGestureCommand(undefined, [hand("Victory", 0.9)])).toBe(
      "resume",
    );
  });

  it("maps the canned Thumb_Up gesture to unmute", () => {
    expect(detectGestureCommand(undefined, [hand("Thumb_Up", 0.9)])).toBe(
      "unmute",
    );
  });

  it("prioritizes a T over open palms", () => {
    const vertical = hand("Open_Palm", 0.9, [
      [0, 0.5, 0.65],
      [12, 0.5, 0.45],
    ]);
    const horizontal = hand("Open_Palm", 0.9, [
      [0, 0.68, 0.45],
      [9, 0.51, 0.45],
      [12, 0.43, 0.45],
    ]);

    expect(detectGestureCommand(undefined, [vertical, horizontal])).toBe("pause");
  });

  it("recognizes prayer hands at the center of the chest", () => {
    const pose = landmarks(33);
    set(pose, 11, 0.35, 0.35);
    set(pose, 12, 0.65, 0.35);
    set(pose, 15, 0.48, 0.55);
    set(pose, 16, 0.52, 0.55);
    set(pose, 19, 0.49, 0.48);
    set(pose, 20, 0.51, 0.48);

    expect(detectGestureCommand(pose, [])).toBe("recalibrate");
  });

  it("recognizes a pointing index finger close to the mouth", () => {
    const pose = landmarks(33);
    set(pose, 9, 0.48, 0.28);
    set(pose, 10, 0.52, 0.28);
    set(pose, 11, 0.35, 0.4);
    set(pose, 12, 0.65, 0.4);
    const pointing = hand("Pointing_Up", 0.9, [[8, 0.5, 0.29]]);

    expect(detectGestureCommand(pose, [pointing])).toBe("mute");
  });
});

function hand(
  categoryName: string,
  score: number,
  points: Array<[number, number, number]> = [],
): DetectedHand {
  const handLandmarks = landmarks(21);
  points.forEach(([index, x, y]) => set(handLandmarks, index, x, y));
  return { categoryName, score, landmarks: handLandmarks };
}

function landmarks(count: number): Landmark[] {
  return Array.from({ length: count }, () => ({
    x: 0,
    y: 0,
    z: 0,
    visibility: 1,
  }));
}

function set(target: Landmark[], index: number, x: number, y: number) {
  target[index] = { x, y, z: 0, visibility: 1 };
}
