import type { ProviderSettings } from "../shared/provider-settings";

const SETTINGS_KEY = "providerSettings";

export class ProviderSettingsStore {
  async get(): Promise<ProviderSettings | null> {
    const result = await chrome.storage.local.get(SETTINGS_KEY);

    return (result[SETTINGS_KEY] as ProviderSettings | undefined) ?? null;
  }

  async save(settings: ProviderSettings): Promise<void> {
    await chrome.storage.local.set({
      [SETTINGS_KEY]: settings
    });
  }

  async clear(): Promise<void> {
    await chrome.storage.local.remove(SETTINGS_KEY);
  }
}