import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLandmarkerWithWorker } from "./poseLandmarker";
import type {
  PoseWorkerRequest,
  PoseWorkerResponse,
} from "./poseWorkerMessages";

class FakeWorker {
  onmessage: ((event: MessageEvent<PoseWorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly messages: PoseWorkerRequest[] = [];
  readonly transfers: Transferable[][] = [];
  readonly terminate = vi.fn();

  postMessage(message: PoseWorkerRequest, transfer: Transferable[] = []) {
    this.messages.push(message);
    this.transfers.push(transfer);
  }

  respond(message: PoseWorkerResponse) {
    this.onmessage?.(new MessageEvent("message", { data: message }));
  }
}

function createFrame() {
  return {
    close: vi.fn(),
  } as unknown as ImageBitmap;
}

async function createReadyClient() {
  const worker = new FakeWorker();
  const clientPromise = createLandmarkerWithWorker(
    worker as unknown as Worker,
    "Loading timed out.",
  );
  worker.respond({ type: "ready" });
  return { client: await clientPromise, worker };
}

describe("PoseInferenceClient", () => {
  beforeEach(() => {
    vi.stubGlobal("document", { baseURI: "https://example.test/" });
    vi.stubGlobal("window", globalThis);
  });

  it("initializes the worker with absolute model and WASM URLs", async () => {
    const { worker } = await createReadyClient();

    expect(worker.messages[0]).toEqual({
      type: "initialize",
      modelUrl: "https://example.test/mediapipe/models/pose_landmarker_lite.task",
      wasmUrl: "https://example.test/mediapipe/wasm",
    });
  });

  it("transfers a frame and resolves the matching result", async () => {
    const { client, worker } = await createReadyClient();
    const frame = createFrame();
    const resultPromise = client.detectForVideo(frame, 1234);
    const request = worker.messages[1];

    expect(request).toMatchObject({
      type: "detect",
      requestId: 1,
      timestamp: 1234,
    });
    expect(worker.transfers[1]).toEqual([frame]);

    worker.respond({
      type: "result",
      requestId: 1,
      landmarks: [{ x: 0.4, y: 0.3, z: 0, visibility: 1 }],
    });

    await expect(resultPromise).resolves.toEqual([
      { x: 0.4, y: 0.3, z: 0, visibility: 1 },
    ]);
  });

  it("rejects and closes an extra frame while inference is in progress", async () => {
    const { client, worker } = await createReadyClient();
    const firstFrame = createFrame();
    const extraFrame = createFrame();
    const firstResult = client.detectForVideo(firstFrame, 1000);

    await expect(client.detectForVideo(extraFrame, 1001)).rejects.toThrow(
      "already in progress",
    );
    expect(extraFrame.close).toHaveBeenCalledOnce();

    worker.respond({
      type: "result",
      requestId: 1,
      landmarks: undefined,
    });
    await firstResult;
  });

  it("rejects an in-flight detection when the client closes", async () => {
    const { client, worker } = await createReadyClient();
    const resultPromise = client.detectForVideo(createFrame(), 1000);

    client.close();

    await expect(resultPromise).rejects.toThrow("was closed");
    expect(worker.messages.at(-1)).toEqual({ type: "close" });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
