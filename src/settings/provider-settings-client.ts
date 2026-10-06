import type { ProviderSettings } from "../shared/provider-settings";

export interface ProviderSettingsReader {
  get(): Promise<ProviderSettings | null>;
}

export class ProviderSettingsClient implements ProviderSettingsReader {
  async get(): Promise<ProviderSettings | null> {
    return chrome.runtime.sendMessage({
      type: "GET_PROVIDER_SETTINGS"
    }) as Promise<ProviderSettings | null>;
  }
}