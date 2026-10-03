import type {
  ExtensionMessage
} from "../shared/messages";
import type {
  CaptureState
} from "../shared/models";

let audioContext: AudioContext | undefined;
let mediaStream: MediaStream | undefined;
let analyser: AnalyserNode | undefined;
let monitorTimer: number | undefined;

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  switch (message.type) {
    case "CAPTURE_STARTED":
      void startCapture(message.streamId);
      break;

    case "OFFSCREEN_STOP":
      stopCapture();
      break;
  }
});

async function startCapture(streamId: string): Promise<void> {
  try {
    await reportState("starting");

    audioContext = new AudioContext();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId
        }
      } as MediaTrackConstraints
    });

    const source = audioContext.createMediaStreamSource(mediaStream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    source.connect(analyser);
    source.connect(audioContext.destination);

    await reportState("capturing");

    startAudioMonitoring();
  } catch (error) {
    console.error("Failed to capture audio:", error);

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
      // The popup may have closed; audio capture should continue.
    });

    monitorTimer = window.setTimeout(monitor, 500);
  };

  monitor();
}

function stopCapture(): void {
  if (monitorTimer !== undefined) {
    window.clearTimeout(monitorTimer);
    monitorTimer = undefined;
  }

  mediaStream?.getTracks().forEach((track) => track.stop());
  mediaStream = undefined;

  analyser?.disconnect();
  analyser = undefined;

  if (audioContext) {
    void audioContext.close();
    audioContext = undefined;
  }

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