import { ProviderSettingsStore } from "../settings/provider-settings-store";

const store = new ProviderSettingsStore();

const form = document.querySelector<HTMLFormElement>("#settings-form")!;
const tokenInput = document.querySelector<HTMLInputElement>("#api-token")!;
const clearButton = document.querySelector<HTMLButtonElement>("#clear-button")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;

function showStatus(message: string): void {
  status.textContent = message;
}

async function loadSettings(): Promise<void> {
  try {
    const settings = await store.get();

    tokenInput.value = settings?.apiToken ?? "";
    showStatus(settings ? "Settings loaded." : "No settings saved.");
  } catch (error) {
    console.error("Failed to load settings:", error);
    showStatus("Unable to load settings.");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const apiToken = tokenInput.value.trim();

  if (!apiToken) {
    showStatus("Please enter an AudD API token.");
    return;
  }

  try {
    await store.save({
      provider: "audd",
      apiToken
    });

    showStatus("Settings saved.");
  } catch (error) {
    console.error("Failed to save settings:", error);
    showStatus("Unable to save settings.");
  }
});

clearButton.addEventListener("click", async () => {
  try {
    await store.clear();
    tokenInput.value = "";
    showStatus("Settings cleared.");
  } catch (error) {
    console.error("Failed to clear settings:", error);
    showStatus("Unable to clear settings.");
  }
});

void loadSettings();