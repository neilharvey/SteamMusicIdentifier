
/** The type of audio identification session. */
export type CaptureMode = "once" | "continuous";

/** The current state of the capture pipeline. */
export type CaptureState =
  | "idle"
  | "starting"
  | "capturing"
  | "identifying"
  | "error";

/** A normalized music identification result from the API. */
export interface TrackIdentification {
  title: string;
  artist: string;
  album?: string;
  recognisedAt: string;
  songLink?: string;
}

/** A track saved in the local identification history. */
export interface IdentificationHistoryItem
  extends TrackIdentification {
  id: string;
}