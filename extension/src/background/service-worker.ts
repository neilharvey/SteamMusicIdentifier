import type {
  ExtensionMessage,
  ExtensionResponse,
  OffscreenCommand
} from "../shared/messages";

async function ensureOffscreenDocument(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"]
  });

  if (contexts.length > 0) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: "offscreen/offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Capture and process audio from the active browser tab."
  });
}

function getMediaStreamId(tabId: number): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId(
      { targetTabId: tabId },
      (streamId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!streamId) {
          reject(new Error("Chrome did not provide a media stream ID."));
          return;
        }

        resolve(streamId);
      }
    );
  });
}

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender,
    sendResponse: (response: ExtensionResponse) => void
  ): boolean => {
    switch (message.type) {
      case "START_CAPTURE":
        void startCapture(message.tabId, message.mode, sendResponse);
        return true;

      case "STOP_CAPTURE":
        void stopCapture(sendResponse);
        return true;

      default:
        return false;
    }
  }
);

async function startCapture(
  tabId: number,
  mode: "once" | "continuous",
  sendResponse: (response: ExtensionResponse) => void
): Promise<void> {
  try {
    await ensureOffscreenDocument();

    const streamId = await getMediaStreamId(tabId);

    const command: OffscreenCommand = {
      type: "CAPTURE_STARTED",
      streamId,
      mode
    };

    await chrome.runtime.sendMessage(command);

    sendResponse({ success: true });
  } catch (error) {
    console.error("Failed to start capture:", error);

    sendResponse({
      success: false,
      error: error instanceof Error
        ? error.message
        : "Failed to start audio capture."
    });
  }
}

async function stopCapture(
  sendResponse: (response: ExtensionResponse) => void
): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      type: "OFFSCREEN_STOP"
    } satisfies OffscreenCommand);

    sendResponse({ success: true });
  } catch (error) {
    console.error("Failed to stop capture:", error);

    sendResponse({
      success: false,
      error: error instanceof Error
        ? error.message
        : "Failed to stop audio capture."
    });
  }
}