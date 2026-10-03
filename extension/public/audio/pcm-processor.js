const CHUNK_DURATION_SECONDS = 5;

class PcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.chunkSize = Math.round(
      sampleRate * CHUNK_DURATION_SECONDS
    );

    this.buffer = new Float32Array(this.chunkSize);
    this.offset = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || input.length === 0) {
      return true;
    }

    // Pass the original audio through to the output.
    if (output) {
      for (let channel = 0; channel < output.length; channel++) {
        const inputChannel = input[channel];

        if (inputChannel) {
          output[channel].set(inputChannel);
        } else {
          output[channel].fill(0);
        }
      }
    }

    // Mix the input channels down to mono.
    const frameCount = input[0].length;

    for (let frame = 0; frame < frameCount; frame++) {
      let sample = 0;

      for (let channel = 0; channel < input.length; channel++) {
        sample += input[channel][frame] ?? 0;
      }

      sample /= input.length;

      this.buffer[this.offset++] = sample;

      if (this.offset === this.chunkSize) {
        const chunk = this.buffer;

        this.port.postMessage(
          {
            type: "PCM_CHUNK",
            sampleRate,
            channels: 1,
            duration: CHUNK_DURATION_SECONDS,
            samples: chunk
          },
          [chunk.buffer]
        );

        this.buffer = new Float32Array(this.chunkSize);
        this.offset = 0;
      }
    }

    return true;
  }
}

registerProcessor("pcm-processor", PcmProcessor);