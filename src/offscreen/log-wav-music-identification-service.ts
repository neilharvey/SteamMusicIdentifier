import type {
  AudioChunk,
  TrackIdentification
} from "../shared/models";

import type {
  MusicIdentificationService
} from "../shared/music-identification";

import { encodePcm16Wav} from "../audio/wav-encoder";

export class LogWavMusicIdentificationService
  implements MusicIdentificationService {
  async identify(
    _chunk: AudioChunk
  ): Promise<TrackIdentification | null> {

    const wav = encodePcm16Wav(_chunk);

    console.log({
    type: wav.type,
    size: wav.size
    });

    return null;
  }
}