import type { DetectedHand, GestureCommand, Landmark } from "./types";

const GESTURE_SCORE_THRESHOLD = 0.65;

export function detectGestureCommand(
  poseLandmarks: readonly Landmark[] | undefined,
  hands: readonly DetectedHand[],
): GestureCommand | null {
  if (isTimeGesture(hands)) return "pause";
  if (isPrayerGesture(poseLandmarks)) return "recalibrate";
  if (isShushGesture(poseLandmarks, hands)) return "mute";
  if (hands.length === 1 && hasCannedGesture(hands, "Open_Palm")) {
    return "stop";
  }
  if (hasCannedGesture(hands, "Victory")) return "resume";
  if (hasCannedGesture(hands, "Thumb_Up")) return "unmute";
  return null;
}

function hasCannedGesture(
  hands: readonly DetectedHand[],
  categoryName: string,
) {
  return hands.some(
    (hand) =>
      hand.categoryName === categoryName && hand.score >= GESTURE_SCORE_THRESHOLD,
  );
}

function isTimeGesture(hands: readonly DetectedHand[]) {
  if (hands.length < 2) return false;

  const axes = hands.slice(0, 2).map(getHandAxis);
  const verticalIndex = axes.findIndex(
    (axis) => axis.dy < 0 && Math.abs(axis.dy) > Math.abs(axis.dx) * 1.35,
  );
  if (verticalIndex < 0) return false;

  const horizontalIndex = verticalIndex === 0 ? 1 : 0;
  const horizontalAxis = axes[horizontalIndex];
  if (Math.abs(horizontalAxis.dx) <= Math.abs(horizontalAxis.dy) * 1.35) {
    return false;
  }

  const verticalHand = hands[verticalIndex].landmarks;
  const horizontalHand = hands[horizontalIndex].landmarks;
  const verticalTip = verticalHand[12];
  const horizontalPalm = horizontalHand[9];
  if (!verticalTip || !horizontalPalm) return false;

  const contactDistance = distance(verticalTip, horizontalPalm);
  const handScale = Math.max(axes[verticalIndex].length, horizontalAxis.length);
  return contactDistance <= handScale * 0.85;
}

function isPrayerGesture(pose: readonly Landmark[] | undefined) {
  if (!pose) return false;

  const leftShoulder = visibleLandmark(pose[11]);
  const rightShoulder = visibleLandmark(pose[12]);
  const leftWrist = visibleLandmark(pose[15]);
  const rightWrist = visibleLandmark(pose[16]);
  const leftIndex = visibleLandmark(pose[19]);
  const rightIndex = visibleLandmark(pose[20]);
  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftWrist ||
    !rightWrist ||
    !leftIndex ||
    !rightIndex
  ) {
    return false;
  }

  const shoulderWidth = distance(leftShoulder, rightShoulder);
  if (shoulderWidth <= 0) return false;

  const shoulderCenter = midpoint(leftShoulder, rightShoulder);
  const wristCenter = midpoint(leftWrist, rightWrist);
  const wristsTogether = distance(leftWrist, rightWrist) <= shoulderWidth * 0.28;
  const handsTogether = distance(leftIndex, rightIndex) <= shoulderWidth * 0.32;
  const centered = Math.abs(wristCenter.x - shoulderCenter.x) <= shoulderWidth * 0.3;
  const atChestHeight =
    wristCenter.y >= shoulderCenter.y - shoulderWidth * 0.15 &&
    wristCenter.y <= shoulderCenter.y + shoulderWidth * 1.15;
  const fingersPointUp =
    leftIndex.y < leftWrist.y - shoulderWidth * 0.04 &&
    rightIndex.y < rightWrist.y - shoulderWidth * 0.04;

  return wristsTogether && handsTogether && centered && atChestHeight && fingersPointUp;
}

function isShushGesture(
  pose: readonly Landmark[] | undefined,
  hands: readonly DetectedHand[],
) {
  if (!pose) return false;

  const leftMouth = visibleLandmark(pose[9]);
  const rightMouth = visibleLandmark(pose[10]);
  const leftShoulder = visibleLandmark(pose[11]);
  const rightShoulder = visibleLandmark(pose[12]);
  if (!leftMouth || !rightMouth || !leftShoulder || !rightShoulder) return false;

  const mouth = midpoint(leftMouth, rightMouth);
  const shoulderWidth = distance(leftShoulder, rightShoulder);
  return hands.some((hand) => {
    if (
      hand.categoryName !== "Pointing_Up" ||
      hand.score < GESTURE_SCORE_THRESHOLD
    ) {
      return false;
    }
    const indexTip = hand.landmarks[8];
    return Boolean(indexTip && distance(indexTip, mouth) <= shoulderWidth * 0.22);
  });
}

function getHandAxis(hand: DetectedHand) {
  const wrist = hand.landmarks[0];
  const middleTip = hand.landmarks[12];
  if (!wrist || !middleTip) return { dx: 0, dy: 0, length: 0 };
  const dx = middleTip.x - wrist.x;
  const dy = middleTip.y - wrist.y;
  return { dx, dy, length: Math.hypot(dx, dy) };
}

function visibleLandmark(landmark: Landmark | undefined) {
  return landmark && (landmark.visibility ?? 1) >= 0.55 ? landmark : undefined;
}

function distance(first: Landmark, second: Landmark) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function midpoint(first: Landmark, second: Landmark) {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}
