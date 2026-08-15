import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type GestureHand = {
  landmarks: NormalizedLandmark[];
  categoryName: string;
  score: number;
};

export type InferenceResult = {
  poseLandmarks: NormalizedLandmark[] | undefined;
  hands: GestureHand[];
};

export type PoseWorkerRequest =
  | {
      type: "initialize";
      gestureModelUrl: string;
      modelUrl: string;
      wasmUrl: string;
    }
  | {
      type: "detect";
      requestId: number;
      timestamp: number;
      frame: ImageBitmap;
      recognizeGestures: boolean;
    }
  | {
      type: "close";
    };

export type PoseWorkerResponse =
  | {
      type: "ready";
    }
  | {
      type: "result";
      requestId: number;
      result: InferenceResult;
    }
  | {
      type: "error";
      phase: "initialize" | "detect";
      message: string;
      requestId?: number;
    };
