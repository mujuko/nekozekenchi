declare const chrome: {
  action: {
    setBadgeText(details: { text: string }): Promise<void>;
    setBadgeBackgroundColor(details: { color: string }): Promise<void>;
  };
  notifications: {
    create(options: {
      type: "basic";
      iconUrl: string;
      title: string;
      message: string;
    }): Promise<string>;
  };
  offscreen: {
    createDocument(parameters: {
      url: string;
      reasons: string[];
      justification: string;
    }): Promise<void>;
    closeDocument(): Promise<void>;
  };
  runtime: {
    getContexts(parameters: {
      contextTypes: string[];
      documentUrls: string[];
    }): Promise<Array<{ documentUrl?: string }>>;
    getURL(path: string): string;
    connect(connectInfo?: { name?: string }): ChromeRuntimePort;
    onConnect: ChromeRuntimeConnectEvent;
    onMessage: ChromeRuntimeMessageEvent;
    sendMessage<T = unknown>(message: unknown): Promise<T>;
  };
};

type ChromeRuntimePort = {
  name: string;
  onDisconnect: {
    addListener(callback: (port: ChromeRuntimePort) => void): void;
  };
  onMessage: {
    addListener(callback: (message: unknown, port: ChromeRuntimePort) => void): void;
  };
  postMessage(message: unknown): void;
};

type ChromeRuntimeConnectEvent = {
  addListener(callback: (port: ChromeRuntimePort) => void): void;
};

type ChromeRuntimeMessageEvent = {
  addListener(
    callback: (
      message: unknown,
      sender: unknown,
      sendResponse: (response?: unknown) => void,
    ) => boolean | void,
  ): void;
};
