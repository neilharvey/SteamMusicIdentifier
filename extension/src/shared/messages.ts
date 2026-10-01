
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

/** Messages sent from the offscreen document to the popup. */
export type OffscreenEvent =
  | {
      type: "CAPTURE_STATE";
      state: CaptureState;
      error?: string;
    }
  | {
      type: "IDENTIFICATION_RESULT";
      result: TrackIdentification;
    };

/** All extension messages. */
export type ExtensionMessage =
  | PopupMessage
  | OffscreenCommand
  | OffscreenEvent;

/** Standard response for popup requests. */
export interface ExtensionResponse {
  success: boolean;
  error?: string;
}