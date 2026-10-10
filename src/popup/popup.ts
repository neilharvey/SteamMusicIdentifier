
import type {
  ExtensionMessage,
  ExtensionResponse
} from "../shared/messages";

import type {
  TrackIdentification,
  IdentificationHistoryItem,
  CaptureMode,
  CaptureState,
  CaptureStatus
} from "../shared/models";

const main = document.querySelector<HTMLElement>("#main")!;
const identifyButton = document.querySelector<HTMLButtonElement>("#identify")!;
const orbIcon = document.querySelector<SVGElement>("#orb-icon")!;
const headline = document.querySelector<HTMLHeadingElement>("#headline")!;
const subheading = document.querySelector<HTMLParagraphElement>("#subheading")!;
const modeSwitch = document.querySelector<HTMLDivElement>("#mode-switch")!;
const onceButton = document.querySelector<HTMLButtonElement>("#mode-once")!;
const continuousButton =
  document.querySelector<HTMLButtonElement>("#mode-continuous")!;
const errorMessage =
  document.querySelector<HTMLDivElement>("#error-message")!;

const trackEyebrow =
  document.querySelector<HTMLDivElement>("#track-eyebrow")!;
const trackContent =
  document.querySelector<HTMLDivElement>("#track-content")!;
const trackActions =
  document.querySelector<HTMLDivElement>("#track-actions")!;
const copyButton =
  document.querySelector<HTMLButtonElement>("#copy-track")!;
const openTrackLink =
  document.querySelector<HTMLAnchorElement>("#open-track")!;
const historyLink =
  document.querySelector<HTMLAnchorElement>("#history-link")!;

let selectedMode: CaptureMode = "once";
let captureState: CaptureState = "idle";
let currentTrack: TrackIdentification | null = null;
let identificationHistory: IdentificationHistoryItem[] = [];

const idleIcon = orbIcon.innerHTML;

const stopIcon = `
  <rect x="6" y="6" width="12" height="12" rx="2"></rect>
`;

function isActive(): boolean {
  return (
    captureState === "starting" ||
    captureState === "capturing" ||
    captureState === "identifying"
  );
}

function setCaptureState(
  state: CaptureState,
  error?: string
): void {
  captureState = state;
  
  main.classList.toggle("is-active", isActive());

  identifyButton.setAttribute(
    "aria-label",
    isActive() ? "Stop identification" : "Identify music"
  );
  identifyButton.title = isActive()
    ? "Stop identification"
    : "Identify music";

  orbIcon.innerHTML = isActive() ? stopIcon : idleIcon;

  onceButton.disabled = isActive();
  continuousButton.disabled = isActive();
  modeSwitch.hidden = isActive();

  errorMessage.textContent = error ?? "";

  switch (state) {
    case "idle":
      headline.textContent = "Identify music";
      subheading.textContent =
        "Find out what's playing in your browser.";
      break;

    case "starting":
      headline.textContent = "Getting ready";
      subheading.textContent = "Connecting to your browser audio…";
      break;

    case "capturing":
      headline.textContent = "Listening…";
      subheading.textContent = "Listening for music in this tab.";
      break;

    case "identifying":
      headline.textContent = "Identifying…";
      subheading.textContent = "Checking the audio for a match.";
      break;

    case "error":
      headline.textContent = "Couldn't identify music";
      subheading.textContent = "Check the message below and try again.";
      break;
  }
}

function updateAudioLevel(level: number): void {
  const intensity = Math.max(0, Math.min(level, 0.25)) / 0.25;
  const glow = 24 + intensity * 18;

  main.style.setProperty("--audio-glow", `${glow}px`);
}

async function send(
  message: ExtensionMessage
): Promise<ExtensionResponse> {
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

function showResult(
  track: TrackIdentification,
  label = "Last identified"
): void {
  currentTrack = track;

  trackEyebrow.textContent = label;
  trackContent.replaceChildren();

  const content = document.createElement("div");
  content.className = "track-content";

  const artwork = document.createElement("div");
  artwork.className = "track-art";
  artwork.setAttribute("aria-hidden", "true");
  artwork.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.6"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 18V5l12-2v13"></path>
      <circle cx="6" cy="18" r="3"></circle>
      <circle cx="18" cy="16" r="3"></circle>
    </svg>
  `;

  const info = document.createElement("div");
  info.className = "track-info";

  const title = document.createElement("div");
  title.className = "track-title";
  title.textContent = track.title;
  title.title = track.title;

  const artist = document.createElement("div");
  artist.className = "track-artist";
  artist.textContent = track.artist;
  artist.title = track.artist;

  info.append(title, artist);

  if (track.album) {
    const album = document.createElement("div");
    album.className = "track-album";
    album.textContent = track.album;
    album.title = track.album;
    info.append(album);
  }

  content.append(artwork, info);
  trackContent.append(content);
  trackActions.hidden = false;

  openTrackLink.hidden = !track.songLink;

  if (track.songLink) {
    openTrackLink.href = track.songLink;
  } else {
    openTrackLink.removeAttribute("href");
  }

  copyButton.textContent = "Copy details";
}

function showEmptyTrack(): void {
  currentTrack = null;
  trackEyebrow.textContent = "Last identified";

  const empty = document.createElement("div");
  empty.className = "empty-track";
  empty.textContent = "Your recognised song will appear here.";

  trackContent.replaceChildren(empty);
  trackActions.hidden = true;
  openTrackLink.hidden = true;
}

async function startIdentification(): Promise<void> {
  try {
    errorMessage.textContent = "";
    setCaptureState("starting");

    const tabId = await activeTabId();

    const response = await send({
      type: "START_CAPTURE",
      tabId,
      mode: selectedMode
    });

    if (!response.success) {
      setCaptureState(
        "error",
        response.error ?? "Failed to start identification."
      );
    }
  } catch (error) {
    console.error("Failed to start identification:", error);

    setCaptureState(
      "error",
      error instanceof Error
        ? error.message
        : "Failed to start identification."
    );
  }
}

async function stopIdentification(): Promise<void> {
  try {
    errorMessage.textContent = "";

    const response = await send({
      type: "STOP_CAPTURE"
    });

    if (!response.success) {
      setCaptureState(
        "error",
        response.error ?? "Failed to stop identification."
      );
      return;
    }

    setCaptureState("idle");
  } catch (error) {
    console.error("Failed to stop identification:", error);

    setCaptureState(
      "error",
      error instanceof Error
        ? error.message
        : "Failed to stop identification."
    );
  }
}

function selectMode(mode: CaptureMode): void {
  selectedMode = mode;

  onceButton.setAttribute(
    "aria-pressed",
    String(mode === "once")
  );
  continuousButton.setAttribute(
    "aria-pressed",
    String(mode === "continuous")
  );
}

async function getIdentificationHistory():
  Promise<IdentificationHistoryItem[]> {
  return chrome.runtime.sendMessage({
    type: "GET_IDENTIFICATION_HISTORY"
  });
}

async function loadHistory(): Promise<void> {
  try {
    identificationHistory = await getIdentificationHistory();

    const mostRecent = identificationHistory[0];

    if (mostRecent && !currentTrack) {
      showResult(mostRecent, "Last identified");
    }
  } catch (error) {
    console.error("Failed to load identification history:", error);
  }
}

async function restoreCaptureState(): Promise<void> {
  try {
    const status = await chrome.runtime.sendMessage({
      type: "GET_CAPTURE_STATE"
    }) as CaptureStatus;

    if (!status) {
      return;
    }

    if (status.mode) {
      selectMode(status.mode);
    }

    setCaptureState(status.state, status.error);
  } catch (error) {
    console.error("Failed to restore capture state:", error);
  }
}

identifyButton.addEventListener("click", () => {
  if (isActive()) {
    void stopIdentification();
  } else {
    void startIdentification();
  }
});

onceButton.addEventListener("click", () => {
  selectMode("once");
});

continuousButton.addEventListener("click", () => {
  selectMode("continuous");
});

copyButton.addEventListener("click", async () => {
  if (!currentTrack) {
    return;
  }

  try {
    await copyTrack(currentTrack);
    copyButton.textContent = "Copied";

    window.setTimeout(() => {
      copyButton.textContent = "Copy details";
    }, 1500);
  } catch (error) {
    console.error("Failed to copy track details:", error);
    copyButton.textContent = "Copy failed";

    window.setTimeout(() => {
      copyButton.textContent = "Copy details";
    }, 1500);
  }
});

historyLink.addEventListener("click", (event) => {
  event.preventDefault();

  void chrome.tabs.create({
    url: chrome.runtime.getURL("history/history.html")
  });
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  switch (message.type) {
    case "CAPTURE_STATE":
      setCaptureState(message.state, message.error);
      break;

    case "AUDIO_LEVEL":
      updateAudioLevel(message.level);
      break;

    case "IDENTIFICATION_RESULT": {
      showResult(message.result, "Just identified");

      const historyItem: IdentificationHistoryItem = {
        ...message.result,
        id: crypto.randomUUID()
      };

      identificationHistory = [
        historyItem,
        ...identificationHistory
      ].slice(0, 50);

      break;
    }
  }
});

selectMode("once");
showEmptyTrack();

void restoreCaptureState();
void loadHistory();