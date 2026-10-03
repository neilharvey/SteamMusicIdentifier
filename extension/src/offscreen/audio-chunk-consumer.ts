import type { AudioChunk } from "../shared/models";
import type { MusicIdentificationService } from "../shared/music-identification";

export class AudioChunkConsumer {
  constructor(
    private readonly identificationService: MusicIdentificationService
  ) {}

  async consume(chunk: AudioChunk): Promise<void> {
    const result = await this.identificationService.identify(chunk);

    if (result === null) {
      console.log("No track identified:", {
        sequenceNumber: chunk.sequenceNumber
      });

      return;
    }

    console.log("Track identified:", result);
  }
}