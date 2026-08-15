import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import type {
  PoseWorkerRequest,
  PoseWorkerResponse,
} from "../app/poseWorkerMessages";

type WorkerScope = {
  onmessage: ((event: MessageEvent<PoseWorkerRequest>) => void) | null;
  postMessage: (message: PoseWorkerResponse) => void;
};

const workerScope = self as unknown as WorkerScope;
let poseLandmarker: PoseLandmarker | null = null;

workerScope.onmessage = (event) => {
  const message = event.data;

  if (message.type === "initialize") {
    void initialize(message.modelUrl, message.wasmUrl);
    return;
  }

  if (message.type === "detect") {
    detect(message.requestId, message.timestamp, message.frame);
    return;
  }

  poseLandmarker?.close();
  poseLandmarker = null;
};

async function initialize(modelUrl: string, wasmUrl: string) {
  try {
    poseLandmarker?.close();
    const vision = await FilesetResolver.forVisionTasks(wasmUrl, true);
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: modelUrl,
        delegate: "CPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.55,
      minPosePresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
    });
    workerScope.postMessage({ type: "ready" });
  } catch (error) {
    workerScope.postMessage({
      type: "error",
      phase: "initialize",
      message: getErrorMessage(error),
    });
  }
}

function detect(requestId: number, timestamp: number, frame: ImageBitmap) {
  try {
    if (!poseLandmarker) {
      throw new Error("Pose Landmarker is not initialized.");
    }

    const result = poseLandmarker.detectForVideo(frame, timestamp);
    workerScope.postMessage({
      type: "result",
      requestId,
      landmarks: result.landmarks[0],
    });
  } catch (error) {
    workerScope.postMessage({
      type: "error",
      phase: "detect",
      requestId,
      message: getErrorMessage(error),
    });
  } finally {
    frame.close();
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
