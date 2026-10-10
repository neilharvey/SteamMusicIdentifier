
import type {
  CaptureMode,
  CaptureState,
  TrackIdentification,
} from "./models";

export interface ExtensionResponse {
  success: boolean;
  error?: string;
}

export interface CaptureStatus {
  state: CaptureState;
  mode?: CaptureMode;
  error?: string;
}

export type PopupMessage =
  | {
      type: "START_CAPTURE";
      tabId: number;
      mode: CaptureMode;
    }
  | {
      type: "STOP_CAPTURE";
    }
  | {
      type: "GET_CAPTURE_STATE";
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

export type OffscreenCommand =
  | {
      type: "CAPTURE_STARTED";
      streamId: string;
      mode: CaptureMode;
    }
  | {
      type: "OFFSCREEN_STOP";
    }
  | {
      type: "GET_OFFSCREEN_CAPTURE_STATE";
    };

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

export type ExtensionMessage =
  | PopupMessage
  | SettingsMessage
  | HistoryMessage
  | OffscreenCommand
  | OffscreenEvent;
