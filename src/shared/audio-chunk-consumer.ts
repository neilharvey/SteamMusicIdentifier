import type { AudioChunk } from "../shared/models";
import type { MusicIdentificationService } from "../shared/music-identification";
import type { TrackIdentification } from "../shared/models";

export class AudioChunkConsumer {
  constructor(
    private readonly identificationService: MusicIdentificationService
  ) {}

  async consume(
    chunk: AudioChunk
  ): Promise<TrackIdentification | null> {
    const result = await this.identificationService.identify(chunk);
  
    if (result === null) {
      console.log("No track identified", chunk.sequenceNumber);
      return null;
    }
  
    console.log("Track identified:", result);
    return result;
  }
}