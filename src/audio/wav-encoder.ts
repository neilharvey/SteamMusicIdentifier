
import type { AudioChunk } from "../shared/models";

const WAV_HEADER_SIZE = 44;
const BITS_PER_SAMPLE = 16;
const BYTES_PER_SAMPLE = BITS_PER_SAMPLE / 8;

export function encodePcm16Wav(chunk: AudioChunk): Blob {
  if (chunk.channels !== 1) {
    throw new Error("Only mono audio is supported.");
  }

  if (chunk.sampleFormat !== "float32") {
    throw new Error("Only Float32 audio is supported.");
  }

  if (!Number.isInteger(chunk.sampleRate) || chunk.sampleRate <= 0) {
    throw new Error("Invalid sample rate.");
  }

  const dataSize = chunk.samples.length * BYTES_PER_SAMPLE;

  // RIFF uses a 32-bit unsigned size field.
  if (dataSize > 0xFFFFFFFF - 36) {
    throw new Error("Audio chunk is too large for a standard WAV file.");
  }

  const buffer = new ArrayBuffer(WAV_HEADER_SIZE + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmt sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM format chunk size
  view.setUint16(20, 1, true);  // Audio format: PCM
  view.setUint16(22, 1, true);  // Channels: mono
  view.setUint32(24, chunk.sampleRate, true);
  view.setUint32(
    28,
    chunk.sampleRate * BYTES_PER_SAMPLE,
    true
  ); // Byte rate
  view.setUint16(32, BYTES_PER_SAMPLE, true); // Block align
  view.setUint16(34, BITS_PER_SAMPLE, true);

  // data sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Convert Float32 samples to signed 16-bit PCM.
  let offset = WAV_HEADER_SIZE;

  for (const sample of chunk.samples) {
    const clamped = Number.isFinite(sample)
      ? Math.max(-1, Math.min(1, sample))
      : 0;

    const pcmSample = clamped < 0
      ? Math.round(clamped * 32768)
      : Math.round(clamped * 32767);

    view.setInt16(offset, pcmSample, true);
    offset += BYTES_PER_SAMPLE;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(
  view: DataView,
  offset: number,
  value: string
): void {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}