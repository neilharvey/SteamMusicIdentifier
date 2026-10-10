
import type { IdentificationHistoryItem } from "../shared/models";

const message = document.querySelector<HTMLParagraphElement>("#message")!;
const historyList = document.querySelector<HTMLElement>("#history-list")!;

async function getIdentificationHistory():
  Promise<IdentificationHistoryItem[]> {
  return chrome.runtime.sendMessage({
    type: "GET_IDENTIFICATION_HISTORY"
  });
}

async function copyTrack(
  track: IdentificationHistoryItem,
  feedback: HTMLElement
): Promise<void> {
  try {
    await navigator.clipboard.writeText(
      `${track.title}\n${track.artist}`
    );

    feedback.textContent = "Copied";
  } catch (error) {
    console.error("Failed to copy track:", error);
    feedback.textContent = "Copy failed";
  }

  window.setTimeout(() => {
    feedback.textContent = "Copy";
  }, 1500);
}

function createTrackRow(
  track: IdentificationHistoryItem
): HTMLElement {
  const row = document.createElement("article");
  row.className = "track";

  const artwork = document.createElement("div");
  artwork.className = "track-art";
  artwork.setAttribute("aria-hidden", "true");
  artwork.textContent = "♪";

  const copyButton = document.createElement("button");
  copyButton.className = "track-copy";
  copyButton.type = "button";
  copyButton.title = "Copy song title and artist";

  const title = document.createElement("div");
  title.className = "track-title";
  title.textContent = track.title;

  const artist = document.createElement("div");
  artist.className = "track-artist";
  artist.textContent = track.artist;

  const date = document.createElement("div");
  date.className = "track-meta";

  const recognisedAt = new Date(track.recognisedAt);
  date.textContent = Number.isNaN(recognisedAt.getTime())
    ? "Date unavailable"
    : recognisedAt.toLocaleString();

  copyButton.append(title, artist, date);

  const links = document.createElement("div");
  links.className = "track-links";

  const copyFeedback = document.createElement("a");
  copyFeedback.href = "#";
  copyFeedback.textContent = "Copy";
  copyFeedback.setAttribute("aria-label", `Copy ${track.title}`);

  copyFeedback.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void copyTrack(track, copyFeedback);
  });

  copyButton.addEventListener("click", () => {
    void copyTrack(track, copyFeedback);
  });

  links.append(copyFeedback);

  if (track.songLink) {
    const openLink = document.createElement("a");
    openLink.href = track.songLink;
    openLink.target = "_blank";
    openLink.rel = "noopener noreferrer";
    openLink.textContent = "Open song";
    openLink.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    links.append(openLink);
  }

  row.append(artwork, copyButton, links);

  return row;
}

function renderHistory(
  items: IdentificationHistoryItem[]
): void {
  historyList.replaceChildren();

  if (items.length === 0) {
    message.textContent = "";

    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent =
      "No songs have been identified yet. Identified tracks will appear here.";

    historyList.append(empty);
    return;
  }

  message.textContent =
    `${items.length} ${items.length === 1 ? "track" : "tracks"} identified`;

  // Group the newest-first list by calendar date.
  let currentDateKey = "";

  for (const item of items) {
    const date = new Date(item.recognisedAt);
    const dateKey = Number.isNaN(date.getTime())
      ? "unknown"
      : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (dateKey !== currentDateKey) {
      currentDateKey = dateKey;

      const heading = document.createElement("h2");
      heading.textContent = dateKey === "unknown"
        ? "Date unavailable"
        : date.toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
          });

      historyList.append(heading);
    }

    const list = historyList.lastElementChild;

    if (list instanceof HTMLDivElement &&
        list.classList.contains("track-list")) {
      list.append(createTrackRow(item));
    } else {
      const trackList = document.createElement("div");
      trackList.className = "track-list";
      trackList.append(createTrackRow(item));
      historyList.append(trackList);
    }
  }
}

async function loadHistory(): Promise<void> {
  try {
    const items = await getIdentificationHistory();
    renderHistory(items);
  } catch (error) {
    console.error("Failed to load identification history:", error);
    message.textContent = "Couldn't load identification history.";

    const retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "Try again";
    retry.addEventListener("click", () => {
      void loadHistory();
    });

    historyList.replaceChildren(retry);
  }
}

void loadHistory();
