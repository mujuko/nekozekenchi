export const LOCALE_STORAGE_KEY = "nekozekenchi:locale";

export type Locale = "ja" | "en";

type Widen<T> = T extends (...args: infer Args) => infer Return
  ? (...args: Args) => Return
  : T extends string
    ? string
    : { [Key in keyof T]: Widen<T[Key]> };

export type Messages = Widen<(typeof messages)["ja"]>;

export const messages = {
  ja: {
    meta: {
      title: "ねこ背検知 - 猫背監視アプリ",
      description:
        "猫背を音で知らせる完全オンデバイスなWebアプリ。映像は外部に送信せず、端末内だけで姿勢を判定します。",
    },
    common: {
      brand: "ねこ背検知",
      copyright: "© 第一無重工",
      github: "GitHub",
      sourceCode: "ソースを見る",
      soundCredit: "効果音: ポケットサウンド",
      language: "表示言語",
      japanese: "日本語",
      english: "English",
    },
    header: {
      homeLabel: "ねこ背検知 ホーム",
      versionLabel: (version: string) => `バージョン ${version}`,
      openMenu: "メニューを開く",
      closeMenu: "メニューを閉じる",
    },
    hero: {
      titleLine1: "背すじが丸まったら、",
      titleEmphasis: "そっとお知らせ。",
      copy: "カメラで頭の高さを見守り、猫背を見つけたら音で知らせます。まずは正面から、目線に近い高さで映してください。",
    },
    camera: {
      placeholderTitle: "カメラを起動しましょう",
      placeholderCopy: "映像は端末内だけで処理されます",
      start: "起動",
      stop: "停止",
      recalibrate: "再調整",
      pause: "一時停止",
      resume: "再開",
      statusPaused: "一時停止中",
      statusMeasuring: "計測中",
      alert: "背すじを伸ばそう",
      waitingPermission: "カメラの許可を待っています...",
      loadingModel: "推論モデルを読込中...",
      loadingModelMessage:
        "初回だけ姿勢とジェスチャーのモデルを読み込みます。しばらくお待ちください。",
      retry: "もう一度試す",
      startupError: "起動エラー",
      localHostRequired: "localhost で起動してください",
      fileUnavailable:
        "カメラは file:// では利用できません。npm run dev または npm run preview で開いてください。",
      filePreviewOnly:
        "画面は確認できますが、file:// ではカメラを利用できません。npm run dev または npm run preview を使ってください。",
      lookingForPerson: "人を探しています",
      permissionTimeout:
        "カメラの許可待ちがタイムアウトしました。ブラウザの許可ダイアログを確認してください。",
      playTimeout: "カメラ映像の開始がタイムアウトしました。",
      permissionDenied:
        "カメラの利用が許可されませんでした。アドレスバー横のカメラ設定から許可してください。",
      notFound: "利用できるカメラが見つかりませんでした。",
      notReadable:
        "カメラを使用できません。他のアプリがカメラを使っていないか確認してください。",
      genericStartupError: "カメラの起動中にエラーが発生しました。",
    },
    calibration: {
      goodTitle: "背すじを伸ばして、そのまま",
      goodHelp: "良い姿勢の頭の高さを覚えています",
      badTitle: "猫背になって、そのまま",
      badHelp: "ここをアウト水準として覚えます",
      transitionTitle: "猫背の姿勢へ",
      transitionHelp: "頭を下げたアウト姿勢を次に登録します",
      status: "姿勢を登録中",
      watching: "見守り中",
    },
    posture: {
      idleBadge: "待機中",
      goodBadge: "いい姿勢",
      badBadge: "猫背を検知",
      badCountdown: (seconds: number) => `あと ${seconds}秒`,
      badStatus: "姿勢が低下",
      missingBadge: "検出待ち",
      pausedBadge: "一時停止中",
    },
    gesture: {
      guide:
        "一時停止：両手でT字⌚／再開：ピース✌️／停止：パー✋／再調整：合掌🙏／ミュート：人差し指を口元🤫／ミュート解除：サムズアップ👍",
      hold: (gesture: string) => `${gesture}を認識中…そのまま保持`,
      pause: "タイム（T字）",
      resume: "ピース",
      stop: "バイバイ（パー）",
      recalibrate: "合掌",
      mute: "人差し指を口元",
      unmute: "サムズアップ",
      paused: "ジェスチャーで一時停止しました",
      resumed: "ジェスチャーで再開しました",
      stopped: "ジェスチャーで停止しました",
      recalibrating: "ジェスチャーで再調整を開始します",
      muted: "ジェスチャーでミュートしました",
      unmuted: "ジェスチャーでミュートを解除しました",
    },
    settings: {
      menuTitle: "設定",
      panelTitle: "見守り設定",
      panelAria: "見守り設定",
      sensitivity: "感度",
      sensitivityHelp: "頭がどれくらい下がったら検知するか",
      sensitivityLoose: "ゆるめ",
      sensitivityNormal: "ふつう",
      sensitivitySensitive: "敏感",
      duration: "お知らせまで",
      durationHelp: "悪い姿勢が続く時間",
      seconds: (seconds: number) => `${seconds}秒`,
      display: "画面表示",
      displayHelp: "カメラ画面に表示するもの",
      displayLabel: "カメラ画面の表示項目",
      showVideo: "映像",
      showPoseGuide: "姿勢ガイド",
      showUprightLine: "良い姿勢ライン",
      showSlouchLine: "猫背ライン",
      sound: "通知音",
      soundHelp: "複数選ぶとランダムに再生",
      soundKindLabel: "通知音の種類",
      soundTone: "電子音",
      soundCat: (index: number) => `ねこ ${index}`,
      mute: "ミュート",
      unmute: "解除",
      muteLabel: "通知音をミュート",
      unmuteLabel: "通知音のミュートを解除",
      volumeLabel: "通知音の音量",
      testSound: "試す ♪",
      testSoundLabel: "通知音を試す",
    },
    tip: {
      title: "うまく測るコツ",
      body: "顔と肩が正面から映る距離で、極端な見下ろしや見上げの画角を避けると安定します。",
    },
    notification: {
      title: "ねこ背検知",
      body: "背すじが丸まっています。姿勢を戻しましょう。",
    },
    model: {
      timeout: "推論モデルの読み込みがタイムアウトしました。",
    },
  },
  en: {
    meta: {
      title: "Nekozekenchi - Posture Watcher",
      description:
        "A fully on-device web app that alerts you when you slouch. Camera video is never sent externally; posture detection runs only on your device.",
    },
    common: {
      brand: "Nekozekenchi",
      copyright: "© Mark I Weightless Industries",
      github: "GitHub",
      sourceCode: "View source",
      soundCredit: "Sounds by Pocket Sound",
      language: "Language",
      japanese: "日本語",
      english: "English",
    },
    header: {
      homeLabel: "Nekozekenchi home",
      versionLabel: (version: string) => `Version ${version}`,
      openMenu: "Open menu",
      closeMenu: "Close menu",
    },
    hero: {
      titleLine1: "Stay upright",
      titleEmphasis: "with a gentle nudge.",
      copy: "Nekozekenchi tracks your head height and plays a sound when it detects slouching. Face the camera near eye level to start.",
    },
    camera: {
      placeholderTitle: "Start the camera",
      placeholderCopy: "Video is processed only on this device",
      start: "Start",
      stop: "Stop",
      recalibrate: "Calibrate",
      pause: "Pause",
      resume: "Resume",
      statusPaused: "Paused",
      statusMeasuring: "Measuring",
      alert: "Sit up straight",
      waitingPermission: "Waiting for camera access...",
      loadingModel: "Loading inference models...",
      loadingModelMessage:
        "Loading the posture and gesture models may take a moment the first time.",
      retry: "Try again",
      startupError: "Startup error",
      localHostRequired: "Open from localhost",
      fileUnavailable:
        "Camera access does not work from file://. Use npm run dev or npm run preview.",
      filePreviewOnly:
        "You can view the screen, but camera access does not work from file://. Use npm run dev or npm run preview.",
      lookingForPerson: "Looking for you",
      permissionTimeout:
        "Camera access timed out. Check the browser permission dialog.",
      playTimeout: "Camera failed to start in time.",
      permissionDenied:
        "Camera access was blocked. Allow it from the browser address bar.",
      notFound: "No camera found.",
      notReadable:
        "Camera is unavailable. Make sure another app is not using it.",
      genericStartupError: "Could not start the camera.",
    },
    calibration: {
      goodTitle: "Sit up straight and hold still",
      goodHelp: "Saving your upright position",
      badTitle: "Now slouch and hold still",
      badHelp: "Saving this as your alert point",
      transitionTitle: "Get ready to slouch",
      transitionHelp: "Next, lower your head for the alert point",
      status: "Calibrating",
      watching: "Watching",
    },
    posture: {
      idleBadge: "Idle",
      goodBadge: "Looks good",
      badBadge: "Slouch detected",
      badCountdown: (seconds: number) => `${seconds}s`,
      badStatus: "Slouching",
      missingBadge: "No pose",
      pausedBadge: "Paused",
    },
    gesture: {
      guide:
        "Pause: T sign⌚ · Resume: Victory sign✌️ · Stop: Open palm✋ · Recalibrate: Prayer hands🙏 · Mute: Finger to lips🤫 · Unmute: Thumbs up👍",
      hold: (gesture: string) => `Recognizing ${gesture}… keep holding`,
      pause: "T sign",
      resume: "Victory sign",
      stop: "Bye-bye (open palm)",
      recalibrate: "Prayer hands",
      mute: "Finger to lips",
      unmute: "Thumbs up",
      paused: "Paused by gesture",
      resumed: "Resumed by gesture",
      stopped: "Stopped by gesture",
      recalibrating: "Starting recalibration by gesture",
      muted: "Muted by gesture",
      unmuted: "Unmuted by gesture",
    },
    settings: {
      menuTitle: "Settings",
      panelTitle: "Posture settings",
      panelAria: "Posture settings",
      sensitivity: "Sensitivity",
      sensitivityHelp: "How much head drop triggers an alert",
      sensitivityLoose: "Low",
      sensitivityNormal: "Normal",
      sensitivitySensitive: "High",
      duration: "Alert after",
      durationHelp: "How long to wait before alerting",
      seconds: (seconds: number) => `${seconds}s`,
      display: "Camera view",
      displayHelp: "Choose what appears on screen",
      displayLabel: "Camera view options",
      showVideo: "Video",
      showPoseGuide: "Pose guide",
      showUprightLine: "Upright line",
      showSlouchLine: "Slouch line",
      sound: "Sound",
      soundHelp: "Pick more than one to randomize",
      soundKindLabel: "Alert sound",
      soundTone: "Beep",
      soundCat: (index: number) => `Meow ${index}`,
      mute: "Mute",
      unmute: "Unmute",
      muteLabel: "Mute alert sound",
      unmuteLabel: "Unmute alert sound",
      volumeLabel: "Alert volume",
      testSound: "Test ♪",
      testSoundLabel: "Test alert sound",
    },
    tip: {
      title: "Tip",
      body: "For steadier detection, keep your face and shoulders in view and avoid steep camera angles.",
    },
    notification: {
      title: "Nekozekenchi",
      body: "You are starting to slouch. Sit up when you can.",
    },
    model: {
      timeout: "Inference model loading timed out.",
    },
  },
} as const;

export function isLocale(value: unknown): value is Locale {
  return value === "ja" || value === "en";
}

export function getMessages(locale: Locale): Messages {
  return messages[locale] as Messages;
}
