import type {
  ExtensionMessage,
  ExtensionResponse,
  OffscreenCommand
} from "../shared/messages";

import { ProviderSettingsStore } from "../settings/provider-settings-store";
import type { ProviderSettings } from "../shared/provider-settings";

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
    message: ExtensionMessage | { type: "GET_PROVIDER_SETTINGS" },
    _sender,
    sendResponse: (response: ExtensionResponse | ProviderSettings | null) => void
  ): boolean => {
    switch (message.type) {
      case "START_CAPTURE":
        void startCapture(message.tabId, message.mode, sendResponse);
        return true;

      case "STOP_CAPTURE":
        void stopCapture(sendResponse);
        return true;

      case "GET_PROVIDER_SETTINGS":
        void getProviderSettings(sendResponse);
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

async function getProviderSettings(
  sendResponse: (response: ProviderSettings | null) => void
): Promise<void> {
  try {
    const settingsStore = new ProviderSettingsStore();
    const settings = await settingsStore.get();

    sendResponse(settings);
  } catch (error) {
    console.error("Failed to retrieve provider settings:", error);
    sendResponse(null);
  }
}