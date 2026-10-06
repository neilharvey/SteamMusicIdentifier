import type {
  AudioChunk,
  TrackIdentification
} from "../shared/models";

import type {
  MusicIdentificationService
} from "../shared/music-identification";

export class NoOpMusicIdentificationService
  implements MusicIdentificationService {
  async identify(
    _chunk: AudioChunk
  ): Promise<TrackIdentification | null> {
    return null;
  }
}