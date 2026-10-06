import type {
  IdentificationHistoryItem,
  TrackIdentification
} from "../shared/models";

const HISTORY_KEY = "identificationHistory";
const MAX_HISTORY_ITEMS = 50;

export class IdentificationHistoryStore {
  async get(): Promise<IdentificationHistoryItem[]> {
    const result = await chrome.storage.local.get(HISTORY_KEY);

    return (
      (result[HISTORY_KEY] as IdentificationHistoryItem[] | undefined) ?? []
    );
  }

  async add(
    track: TrackIdentification
  ): Promise<IdentificationHistoryItem> {
    const item: IdentificationHistoryItem = {
      ...track,
      id: crypto.randomUUID()
    };

    const history = await this.get();

    const updatedHistory = [
      item,
      ...history
    ].slice(0, MAX_HISTORY_ITEMS);

    await chrome.storage.local.set({
      [HISTORY_KEY]: updatedHistory
    });

    return item;
  }

  async clear(): Promise<void> {
    await chrome.storage.local.remove(HISTORY_KEY);
  }
}