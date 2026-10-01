
type CaptureMode = "single" | "continuous";

interface StartCaptureMessage {
  type: "START_CAPTURE";
  targetTabId: number;
  mode: CaptureMode;
}

interface StopCaptureMessage {
  type: "STOP_CAPTURE";
}

type PopupMessage = StartCaptureMessage | StopCaptureMessage;

interface CaptureResponse {
  success: boolean;
  error?: string;
}

async function ensureOffscreenDocument(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });

  if (contexts.length > 0) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: "offscreen/offscreen.html",
    reasons: ["USER_MEDIA"],
    justification:
      "Capture and process audio from the active browser tab.",
  });
}

function getMediaStreamId(targetTabId: number): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId(
      { targetTabId },
      (streamId) => {
        const error = chrome.runtime.lastError;

        if (error) {
          reject(new Error(error.message));
          return;
        }

        if (!streamId) {
          reject(new Error("No media stream ID was returned."));
          return;
        }

        resolve(streamId);
      }
    );
  });
}

async function startCapture(
  message: StartCaptureMessage
): Promise<void> {
  await ensureOffscreenDocument();

  const streamId = await getMediaStreamId(message.targetTabId);

  await chrome.runtime.sendMessage({
    type: "CAPTURE_STARTED",
    streamId,
    mode: message.mode,
  });
}

async function stopCapture(): Promise<void> {
  await chrome.runtime.sendMessage({
    type: "OFFSCREEN_STOP",
  });
}

chrome.runtime.onMessage.addListener(
  (
    message: PopupMessage,
    _sender,
    sendResponse: (response: CaptureResponse) => void
  ): boolean => {
    if (
      message?.type !== "START_CAPTURE" &&
      message?.type !== "STOP_CAPTURE"
    ) {
      return false;
    }

    const handleMessage = async (): Promise<void> => {
      try {
        if (message.type === "START_CAPTURE") {
          await startCapture(message);
        } else {
          await stopCapture();
        }

        sendResponse({ success: true });
      } catch (error) {
        sendResponse({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
        });
      }
    };

    void handleMessage();

    // Keep the message channel open for the async response.
    return true;
  }
);