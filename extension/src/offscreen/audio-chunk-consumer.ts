import type { AudioChunk } from "../shared/models";

/**
 * Receives a completed PCM chunk for processing.
 *
 * Replace this implementation with the music-identification
 * integration when that part of the application is ready.
 */
export function consumeAudioChunk(chunk: AudioChunk): void {
  console.log("Consuming audio chunk:", {
    sequenceNumber: chunk.sequenceNumber,
    sampleRate: chunk.sampleRate,
    channels: chunk.channels,
    sampleFormat: chunk.sampleFormat,
    sampleCount: chunk.samples.length,
    durationSeconds: chunk.samples.length / chunk.sampleRate,
    byteLength: chunk.samples.byteLength
  });
}