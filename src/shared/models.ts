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


/** A single chunk of captured, uncompressed PCM audio. */
export interface AudioChunk {
  /** Zero-based position of this chunk within the capture session. */
  sequenceNumber: number;

  /** Number of samples per second, e.g. 48000. */
  sampleRate: number;

  /** Number of audio channels. The current pipeline produces mono. */
  channels: 1;

  /** Sample encoding used by the samples buffer. */
  sampleFormat: "float32";

  /** Mono audio samples, normalized to the range -1.0 to 1.0. */
  samples: Float32Array;
}

export interface CaptureStatus {
  state: CaptureState;
  mode?: CaptureMode;
  error?: string;
}