import {
  FilesetResolver,
  GestureRecognizer,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import type {
  PoseWorkerRequest,
  PoseWorkerResponse,
} from "./poseProtocol";

type WorkerScope = {
  onmessage: ((event: MessageEvent<PoseWorkerRequest>) => void) | null;
  postMessage: (message: PoseWorkerResponse) => void;
};

const workerScope = self as unknown as WorkerScope;
let poseLandmarker: PoseLandmarker | null = null;
let gestureRecognizer: GestureRecognizer | null = null;

workerScope.onmessage = (event) => {
  const message = event.data;

  if (message.type === "initialize") {
    void initialize(message.modelUrl, message.gestureModelUrl, message.wasmUrl);
    return;
  }

  if (message.type === "detect") {
    detect(
      message.requestId,
      message.timestamp,
      message.frame,
      message.recognizeGestures,
    );
    return;
  }

  poseLandmarker?.close();
  poseLandmarker = null;
  gestureRecognizer?.close();
  gestureRecognizer = null;
};

async function initialize(
  modelUrl: string,
  gestureModelUrl: string,
  wasmUrl: string,
) {
  try {
    poseLandmarker?.close();
    gestureRecognizer?.close();
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
    gestureRecognizer = await GestureRecognizer.createFromOptions(
      freshModuleFileset(vision, "gesture"),
      {
        baseOptions: {
          modelAssetPath: gestureModelUrl,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.55,
        minHandPresenceConfidence: 0.55,
        minTrackingConfidence: 0.55,
        cannedGesturesClassifierOptions: {
          maxResults: 1,
          scoreThreshold: 0.65,
        },
      },
    );
    workerScope.postMessage({ type: "ready" });
  } catch (error) {
    workerScope.postMessage({
      type: "error",
      phase: "initialize",
      message: getErrorMessage(error),
    });
  }
}

function freshModuleFileset(
  fileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
  instance: string,
) {
  const separator = fileset.wasmLoaderPath.includes("?") ? "&" : "?";
  return {
    ...fileset,
    // The ES module loader clears ModuleFactory after creating one task. A
    // distinct module URL runs the loader again for the second task instance.
    wasmLoaderPath: `${fileset.wasmLoaderPath}${separator}instance=${instance}`,
  };
}

function detect(
  requestId: number,
  timestamp: number,
  frame: ImageBitmap,
  recognizeGestures: boolean,
) {
  try {
    if (!poseLandmarker || !gestureRecognizer) {
      throw new Error("Inference models are not initialized.");
    }

    const poseResult = poseLandmarker.detectForVideo(frame, timestamp);
    const gestureResult = recognizeGestures
      ? gestureRecognizer.recognizeForVideo(frame, timestamp)
      : undefined;
    workerScope.postMessage({
      type: "result",
      requestId,
      result: {
        poseLandmarks: poseResult.landmarks[0],
        hands:
          gestureResult?.landmarks.map((landmarks, index) => {
            const gesture = gestureResult.gestures[index]?.[0];
            return {
              landmarks,
              categoryName: gesture?.categoryName ?? "None",
              score: gesture?.score ?? 0,
            };
          }) ?? [],
      },
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
