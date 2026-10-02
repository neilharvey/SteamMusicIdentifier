import type {
  ExtensionMessage,
  ExtensionResponse
} from "../shared/messages";
import type { TrackIdentification } from "../shared/models";

const status = document.querySelector<HTMLDivElement>("#status")!;
const result = document.querySelector<HTMLDivElement>("#result")!;

async function send(message: ExtensionMessage): Promise<ExtensionResponse> {
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
  } catch (e) {
    status.textContent = String(e);
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
  } catch (e) {
    status.textContent = String(e);
  }
});

document.querySelector("#stop")!.addEventListener("click", async () => {
  try {
    const response = await send({ type: "STOP_CAPTURE" });

    if (!response.success) {
      throw new Error(response.error ?? "Failed to stop capture.");
    }

    status.textContent = "Stopped";
  } catch (e) {
    status.textContent = String(e);
  }
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.type === "CAPTURE_STATE") {
    status.textContent = message.error ?? message.state;
  }

  if (message.type === "IDENTIFICATION_RESULT") {
    showResult(message.result);
  }
});

function showResult(track: TrackIdentification) {
  result.innerHTML = "";

  const title = document.createElement("strong");
  title.textContent = track.title;

  const artist = document.createElement("div");
  artist.textContent = track.artist;

  result.append(title, artist);

  if (track.songLink) {
    const link = document.createElement("a");
    link.href = track.songLink;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open track";

    result.append(document.createElement("br"), link);
  }
}