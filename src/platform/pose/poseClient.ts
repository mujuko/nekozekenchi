import PoseLandmarkerWorker from "./poseLandmarker.worker?worker&inline";
import type { Messages } from "../../localization/messages";
import type {
  PoseWorkerRequest,
  PoseWorkerResponse,
  InferenceResult,
} from "./poseProtocol";
import { withTimeout } from "../../shared/async/withTimeout";

const MODEL_PATH = "mediapipe/models/pose_landmarker_lite.task";
const GESTURE_MODEL_PATH = "mediapipe/models/gesture_recognizer.task";
const WASM_PATH = "mediapipe/wasm";
const STARTUP_TIMEOUT_MS = 30_000;

type PendingDetection = {
  requestId: number;
  resolve: (result: InferenceResult) => void;
  reject: (error: Error) => void;
};

export type PoseInferenceClient = {
  close: () => void;
  detectForVideo: (
    frame: ImageBitmap,
    timestamp: number,
    recognizeGestures: boolean,
  ) => Promise<InferenceResult>;
};

export async function createLandmarker(t: Messages): Promise<PoseInferenceClient> {
  return createLandmarkerWithWorker(new PoseLandmarkerWorker(), t.model.timeout);
}

export async function createLandmarkerWithWorker(
  worker: Worker,
  timeoutMessage: string,
): Promise<PoseInferenceClient> {
  let readyResolve: (() => void) | null = null;
  let readyReject: ((error: Error) => void) | null = null;
  let pendingDetection: PendingDetection | null = null;
  let nextRequestId = 1;
  let closed = false;

  const ready = new Promise<void>((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });

  worker.onmessage = (event: MessageEvent<PoseWorkerResponse>) => {
    const message = event.data;

    if (message.type === "ready") {
      readyResolve?.();
      readyResolve = null;
      readyReject = null;
      return;
    }

    if (message.type === "result") {
      if (pendingDetection?.requestId !== message.requestId) return;
      const detection = pendingDetection;
      pendingDetection = null;
      detection.resolve(message.result);
      return;
    }

    const error = new Error(message.message);
    if (message.phase === "initialize") {
      readyReject?.(error);
      readyResolve = null;
      readyReject = null;
      return;
    }

    if (pendingDetection && pendingDetection.requestId === message.requestId) {
      const detection = pendingDetection;
      pendingDetection = null;
      detection.reject(error);
    }
  };

  worker.onerror = (event) => {
    const error = new Error(event.message || "Pose inference worker failed.");
    readyReject?.(error);
    readyResolve = null;
    readyReject = null;
    if (pendingDetection) {
      const detection = pendingDetection;
      pendingDetection = null;
      detection.reject(error);
    }
  };

  const initializeMessage: PoseWorkerRequest = {
    type: "initialize",
    gestureModelUrl: resolveAssetUrl(GESTURE_MODEL_PATH),
    modelUrl: resolveAssetUrl(MODEL_PATH),
    wasmUrl: resolveAssetUrl(WASM_PATH),
  };
  worker.postMessage(initializeMessage);

  try {
    await withTimeout(ready, STARTUP_TIMEOUT_MS, timeoutMessage);
  } catch (error) {
    worker.terminate();
    throw error;
  }

  return {
    close() {
      if (closed) return;
      closed = true;
      const error = new Error("Pose inference worker was closed.");
      pendingDetection?.reject(error);
      pendingDetection = null;
      const closeMessage: PoseWorkerRequest = { type: "close" };
      worker.postMessage(closeMessage);
      worker.terminate();
    },

    detectForVideo(frame, timestamp, recognizeGestures) {
      if (closed) {
        frame.close();
        return Promise.reject(new Error("Pose inference worker is closed."));
      }
      if (pendingDetection) {
        frame.close();
        return Promise.reject(new Error("Pose inference is already in progress."));
      }

      const requestId = nextRequestId++;
      const message: PoseWorkerRequest = {
        type: "detect",
        requestId,
        timestamp,
        frame,
        recognizeGestures,
      };

      return new Promise((resolve, reject) => {
        pendingDetection = { requestId, resolve, reject };
        try {
          worker.postMessage(message, [frame]);
        } catch (error) {
          pendingDetection = null;
          frame.close();
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
    },
  };
}

function resolveAssetUrl(path: string) {
  return new URL(`${import.meta.env.BASE_URL}${path}`, document.baseURI).href;
}
