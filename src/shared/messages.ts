import type {
  CaptureMode,
  CaptureState,
  TrackIdentification
} from "./models";

/** Messages sent from the popup to the service worker. */
export type PopupMessage =
  | {
      type: "START_CAPTURE";
      tabId: number;
      mode: CaptureMode;
    }
  | {
      type: "STOP_CAPTURE";
    };

export type SettingsMessage = {
  type: "GET_PROVIDER_SETTINGS";
};

export type HistoryMessage =
  | {
      type: "GET_IDENTIFICATION_HISTORY";
    }
  | {
      type: "CLEAR_IDENTIFICATION_HISTORY";
    };

/** Messages sent from the service worker to the offscreen document. */
export type OffscreenCommand =
  | {
      type: "CAPTURE_STARTED";
      streamId: string;
      mode: CaptureMode;
    }
  | {
      type: "OFFSCREEN_STOP";
    };

/** Messages sent from the offscreen document to other extension contexts. */
export type OffscreenEvent =
  | {
      type: "CAPTURE_STATE";
      state: CaptureState;
      error?: string;
    }
  | {
      type: "AUDIO_LEVEL";
      level: number;
    }
  | {
      type: "IDENTIFICATION_RESULT";
      result: TrackIdentification;
    };

/** All extension messages. */
export type ExtensionMessage =
  | PopupMessage
  | SettingsMessage
  | HistoryMessage
  | OffscreenCommand
  | OffscreenEvent;

/** Standard response for popup requests. */
export interface ExtensionResponse {
  success: boolean;
  error?: string;
}