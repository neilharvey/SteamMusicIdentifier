
import type { ExtensionMessage } from "../shared/messages";
import type { CaptureMode, TrackIdentification } from "../shared/models";

const API_URL = "https://localhost:7043/api/identifications";
const CLIP_LENGTH_MS = 12_000;

let stream: MediaStream | undefined;
let audioContext: AudioContext | undefined;
let recorder: MediaRecorder | undefined;
let mode: CaptureMode = "once";
let active = false;
let identifying = false;
let clipTimer: ReturnType<typeof setTimeout> | undefined;

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage) => {
    if (message.type === "CAPTURE_STARTED") {
      void startCapture(message.streamId, message.mode);
    }

    if (message.type === "OFFSCREEN_STOP") {
    void stopCapture();
    }
  }
);

async function startCapture(
  streamId: string,
  captureMode: CaptureMode
) {
  if (active) await stopCapture();

  mode = captureMode;
  active = true;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId
        } as MediaTrackConstraints
      } as MediaTrackConstraints,
      video: false
    });

    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);

    // Preserve the user's normal stream audio output.
    source.connect(audioContext.destination);

    await audioContext.resume();

    notifyState("capturing");
    recordNextClip();
  } catch (error) {
    active = false;
    notifyState("error", String(error));
    await stopCapture();
  }
}

function recordNextClip() {
  if (!active || identifying) return;

  if (!stream) return;

  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";

  recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];

  recorder.ondataavailable = event => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  recorder.onstop = async () => {
    if (!active) return;

    const clip = new Blob(chunks, { type: mimeType });

    if (clip.size > 0) {
      identifying = true;
      notifyState("identifying");

      try {
        const track = await identify(clip);
        if (track) {
          await saveResult(track);
        }
      } catch (error) {
        notifyState("error", String(error));
      } finally {
        identifying = false;
      }
    }

    if (mode === "once") {
      await stopCapture();
    } else if (active) {
      notifyState("capturing");
      recordNextClip();
    }
  };

  recorder.start();

  clipTimer = setTimeout(() => {
    if (recorder?.state === "recording") {
      recorder.stop();
    }
  }, CLIP_LENGTH_MS);
}

async function identify(clip: Blob): Promise<TrackIdentification | null> {
  const form = new FormData();
  form.append("audio", clip, "clip.webm");

  const response = await fetch(API_URL, {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    throw new Error(`Recognition failed: ${response.status}`);
  }

  const result = await response.json();

  return result as TrackIdentification | null;
}

async function saveResult(track: TrackIdentification) {
  await chrome.storage.local.set({
    lastIdentifiedTrack: track
  });

  await chrome.runtime.sendMessage({
    type: "IDENTIFICATION_RESULT",
    result: track
  } satisfies ExtensionMessage);
}

async function stopCapture() {
  active = false;

  if (clipTimer) clearTimeout(clipTimer);
  clipTimer = undefined;

  if (recorder?.state === "recording") {
    recorder.stop();
  }

  stream?.getTracks().forEach(track => track.stop());
  stream = undefined;

  if (audioContext) {
    await audioContext.close();
    audioContext = undefined;
  }

  recorder = undefined;
  identifying = false;
  notifyState("idle");
}

function notifyState(
  state: "idle" | "capturing" | "identifying" | "error",
  error?: string
) {
  void chrome.runtime.sendMessage({
    type: "CAPTURE_STATE",
    state,
    error
  } satisfies ExtensionMessage);
}