import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type PoseWorkerRequest =
  | {
      type: "initialize";
      modelUrl: string;
      wasmUrl: string;
    }
  | {
      type: "detect";
      requestId: number;
      timestamp: number;
      frame: ImageBitmap;
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
      landmarks: NormalizedLandmark[] | undefined;
    }
  | {
      type: "error";
      phase: "initialize" | "detect";
      message: string;
      requestId?: number;
    };
