import type { AudioChunk, TrackIdentification } from "./models";

export interface MusicIdentificationService {
  identify(
    chunk: AudioChunk
  ): Promise<TrackIdentification | null>;
}