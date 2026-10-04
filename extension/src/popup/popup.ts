import type {
  ExtensionMessage,
  ExtensionResponse
} from "../shared/messages";
import type {
  TrackIdentification
} from "../shared/models";

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
  // Scale the display so that typical audio levels are visible.
  const displayLevel = Math.max(0, Math.min(level, 0.25));
  const percentage = (displayLevel / 0.25) * 100;

  meterBar.style.width = `${percentage}%`;
  meterLabel.textContent = `Audio level: ${level.toFixed(4)}`;
}

async function send(
  message: ExtensionMessage
): Promise<ExtensionResponse> {
  return chrome.runtime.sendMessage(message);
}

async function activeTabId(): Promise<number> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab?.id) {
    throw new Error("Unable to determine the active tab.");
  }

  return tab.id;
}

document.querySelector("#identify")!.addEventListener("click", async () => {
  try {
    status.textContent = "Starting capture...";

    const tabId = await activeTabId();

    const response = await send({
      type: "START_CAPTURE",
      tabId,
      mode: "once"
    });

    if (!response.success) {
      throw new Error(response.error ?? "Failed to start capture.");
    }

    status.textContent = "Capture request received";
  } catch (error) {
    status.textContent = String(error);
  }
});

document.querySelector("#continuous")!.addEventListener("click", async () => {
  try {
    status.textContent = "Starting continuous capture...";

    const tabId = await activeTabId();

    const response = await send({
      type: "START_CAPTURE",
      tabId,
      mode: "continuous"
    });

    if (!response.success) {
      throw new Error(response.error ?? "Failed to start capture.");
    }

    status.textContent = "Capture request received";
  } catch (error) {
    status.textContent = String(error);
  }
});

document.querySelector("#stop")!.addEventListener("click", async () => {
  try {
    const response = await send({ type: "STOP_CAPTURE" });

    if (!response.success) {
      throw new Error(response.error ?? "Failed to stop capture.");
    }

    status.textContent = "Stopped";
  } catch (error) {
    status.textContent = String(error);
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

function showResult(track: TrackIdentification): void {
  result.innerHTML = "";

  const title = document.createElement("strong");
  title.textContent = track.title;

  const artist = document.createElement("div");
  artist.textContent = track.artist;

  if (track.album) {
    const album = document.createElement("div");
    album.textContent = track.album;
    result.append(album);
  }  

  result.append(title, artist);

  const copyButton = document.createElement("button");
  copyButton.textContent = "Copy song details";

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(`${track.title}\n${track.artist}`);
      copyButton.textContent = "Copied!";
    } catch (error) {
      console.error("Failed to copy song details:", error);
      copyButton.textContent = "Copy failed";
    }
  });

  result.append(copyButton);
}