import type {
  ExtensionMessage
} from "../shared/messages";
import { consumeAudioChunk } from "./audio-chunk-consumer";

import type {
  CaptureMode,
  CaptureState,
  AudioChunk
} from "../shared/models";

let audioContext: AudioContext | undefined;
let mediaStream: MediaStream | undefined;
let source: MediaStreamAudioSourceNode | undefined;
let analyser: AnalyserNode | undefined;
let workletNode: AudioWorkletNode | undefined;
let monitorTimer: number | undefined;
let captureMode: CaptureMode | undefined;
let processingOnce = false;

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  switch (message.type) {
    case "CAPTURE_STARTED":
      void startCapture(message.streamId, message.mode);
      break;

    case "OFFSCREEN_STOP":
      stopCapture();
      break;
  }
});

async function startCapture(
  streamId: string,
  mode: CaptureMode
): Promise<void> {
  captureMode = mode;
  processingOnce = false;
  try {
    await reportState("starting");

    audioContext = new AudioContext();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    await audioContext.audioWorklet.addModule(
      chrome.runtime.getURL("audio/pcm-processor.js")
    );

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId
        }
      } as MediaTrackConstraints
    });

    source = audioContext.createMediaStreamSource(mediaStream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    workletNode = new AudioWorkletNode(
      audioContext,
      "pcm-processor"
    );

    workletNode.port.onmessage = (
      event: MessageEvent<{
        type: string;
        sequenceNumber: number;
        sampleRate: number;
        channels: 1;
        sampleFormat: "float32";
        samples: Float32Array;
      }>
    ) => {
      const message = event.data;
    
      if (message.type !== "PCM_CHUNK") {
        return;
      }
    
      const chunk: AudioChunk = {
        sequenceNumber: message.sequenceNumber,
        sampleRate: message.sampleRate,
        channels: message.channels,
        sampleFormat: message.sampleFormat,
        samples: message.samples
      };
    
      void handleAudioChunk(chunk);
    };

    source.connect(analyser);
    source.connect(workletNode);
    workletNode.connect(audioContext.destination);

    await reportState("capturing");

    startAudioMonitoring();
  } catch (error) {
    console.error("Failed to capture audio:", error);
  
    captureMode = undefined;
    processingOnce = false;
    stopAudioResources();
  
    await reportState(
      "error",
      error instanceof Error
        ? error.message
        : "Failed to capture audio."
    );
  }
}

function startAudioMonitoring(): void {
  if (!analyser) {
    return;
  }

  const buffer = new Uint8Array(analyser.fftSize);

  const monitor = () => {
    if (!analyser) {
      return;
    }

    analyser.getByteTimeDomainData(buffer);

    let sum = 0;

    for (const value of buffer) {
      const sample = (value - 128) / 128;
      sum += sample * sample;
    }

    const rms = Math.sqrt(sum / buffer.length);

    void chrome.runtime.sendMessage({
      type: "AUDIO_LEVEL",
      level: rms
    } satisfies ExtensionMessage).catch(() => {
      // The popup may have closed; capture continues.
    });

    monitorTimer = window.setTimeout(monitor, 500);
  };

  monitor();
}

function stopAudioResources(): void {
  if (monitorTimer !== undefined) {
    window.clearTimeout(monitorTimer);
    monitorTimer = undefined;
  }

  if (workletNode) {
    workletNode.port.onmessage = null;
    workletNode.disconnect();
    workletNode = undefined;
  }

  source?.disconnect();
  source = undefined;

  analyser?.disconnect();
  analyser = undefined;

  mediaStream?.getTracks().forEach((track) => track.stop());
  mediaStream = undefined;

  if (audioContext) {
    void audioContext.close();
    audioContext = undefined;
  }
}

function stopCapture(): void {
  captureMode = undefined;
  processingOnce = false;

  stopAudioResources();
  void reportState("idle");
}

async function reportState(
  state: CaptureState,
  error?: string
): Promise<void> {
  await chrome.runtime.sendMessage({
    type: "CAPTURE_STATE",
    state,
    error
  } satisfies ExtensionMessage);
}


async function handleAudioChunk(chunk: AudioChunk): Promise<void> {
  if (captureMode === undefined) {
    return;
  }

  if (captureMode === "once") {
    // Prevent another chunk being processed while this one completes.
    if (processingOnce) {
      return;
    }

    processingOnce = true;

    await reportState("identifying");

    // The user may have stopped capture while the state was updating.
    if (captureMode !== "once") {
      return;
    }

    consumeAudioChunk(chunk);

    // One complete chunk has been consumed; end this session.
    stopAudioResources();
    captureMode = undefined;

    await reportState("idle");
    return;
  }

  // Continuous mode: consume each chunk and keep capturing.
  consumeAudioChunk(chunk);
}