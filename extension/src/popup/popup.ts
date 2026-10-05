import type {
  ExtensionMessage,
  ExtensionResponse
} from "../shared/messages";
import type { TrackIdentification } from "../shared/models";

const status = document.querySelector<HTMLDivElement>("#status")!;
const result = document.querySelector<HTMLDivElement>("#result")!;

// Create the audio meter.
const meterContainer = document.createElement("div");
meterContainer.style.marginTop = "12px";

const meterLabel = document.createElement("div");
meterLabel.textContent = "Audio level: 0.0000";
meterLabel.style.marginBottom = "4px";

const meterTrack = document.createElement("div");
meterTrack.style.width = "100%";
meterTrack.style.height = "12px";
meterTrack.style.backgroundColor = "#ddd";
meterTrack.style.borderRadius = "6px";
meterTrack.style.overflow = "hidden";

const meterBar = document.createElement("div");
meterBar.style.width = "0%";
meterBar.style.height = "100%";
meterBar.style.backgroundColor = "#238636";
meterBar.style.transition = "width 0.2s ease";

meterTrack.append(meterBar);
meterContainer.append(meterLabel, meterTrack);

status.insertAdjacentElement("afterend", meterContainer);

function updateAudioLevel(level: number): void {
  const displayLevel = Math.max(0, Math.min(level, 0.25));
  const percentage = (displayLevel / 0.25) * 100;

  meterBar.style.width = `${percentage}%`;
  meterLabel.textContent = `Audio level: ${level.toFixed(4)}`;
}

async function send(message: ExtensionMessage): Promise<ExtensionResponse> {
  return chrome.runtime.sendMessage(message);
}

async function activeTabId(): Promise<number> {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  const tab = tabs[0];

  if (tab?.id === undefined) {
    throw new Error("No active tab found.");
  }

  return tab.id;
}

async function copyTrack(track: TrackIdentification): Promise<void> {
  const text = `${track.title}\n${track.artist}`;

  await navigator.clipboard.writeText(text);
}

function showResult(track: TrackIdentification): void {
  result.innerHTML = "";

  const title = document.createElement("strong");
  title.textContent = track.title;

  const artist = document.createElement("div");
  artist.textContent = track.artist;

  result.append(title, artist);

  if (track.album) {
    const album = document.createElement("div");
    album.textContent = track.album;
    result.append(album);
  }

  const copyButton = document.createElement("button");
  copyButton.textContent = "Copy song details";

  copyButton.addEventListener("click", async () => {
    try {
      await copyTrack(track);
      copyButton.textContent = "Copied!";
    } catch (error) {
      console.error("Failed to copy song details:", error);
      copyButton.textContent = "Copy failed";
    }
  });

  result.append(copyButton);
}

document.querySelector("#identify")!.addEventListener("click", async () => {
  try {
    const tabId = await activeTabId();

    status.textContent = "Starting...";

    const response = await send({
      type: "START_CAPTURE",
      tabId,
      mode: "once"
    });

    if (!response.success) {
      status.textContent = response.error ?? "Failed to start capture.";
    }
  } catch (error) {
    console.error("Failed to start identification:", error);
    status.textContent =
      error instanceof Error ? error.message : "Failed to start identification.";
  }
});

document.querySelector("#continuous")!.addEventListener("click", async () => {
  try {
    const tabId = await activeTabId();

    status.textContent = "Starting...";

    const response = await send({
      type: "START_CAPTURE",
      tabId,
      mode: "continuous"
    });

    if (!response.success) {
      status.textContent = response.error ?? "Failed to start capture.";
    }
  } catch (error) {
    console.error("Failed to start continuous identification:", error);
    status.textContent =
      error instanceof Error
        ? error.message
        : "Failed to start continuous identification.";
  }
});

document.querySelector("#stop")!.addEventListener("click", async () => {
  try {
    const response = await send({
      type: "STOP_CAPTURE"
    });

    if (!response.success) {
      status.textContent = response.error ?? "Failed to stop capture.";
    }
  } catch (error) {
    console.error("Failed to stop capture:", error);
    status.textContent =
      error instanceof Error ? error.message : "Failed to stop capture.";
  }
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  switch (message.type) {
    case "CAPTURE_STATE":
      status.textContent = message.error ?? message.state;

      if (message.state === "idle") {
        updateAudioLevel(0);
      }

      break;

    case "AUDIO_LEVEL":
      updateAudioLevel(message.level);
      break;

    case "IDENTIFICATION_RESULT":
      showResult(message.result);
      break;
  }
});