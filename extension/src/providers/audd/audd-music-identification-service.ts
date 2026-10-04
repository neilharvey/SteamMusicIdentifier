import type { AudioChunk, TrackIdentification } from "../../shared/models";
import type { MusicIdentificationService } from "../../shared/music-identification";
import { ProviderSettingsReader } from "../../settings/provider-settings-client";
import { encodePcm16Wav } from "../../audio/wav-encoder";

const AUDD_ENDPOINT = "https://api.audd.io/";

interface AudDResult {
  artist?: string;
  title?: string;
  album?: string;
  song_link?: string;
}

interface AudDResponse {
  status: "success" | "error";
  result: AudDResult | null;
  error?: {
    error_code?: number;
    error_message?: string;
  };
}

export class AuddMusicIdentificationService
  implements MusicIdentificationService
{
  constructor(
    private readonly settingsStore: ProviderSettingsReader
  ) {}

  async identify(chunk: AudioChunk): Promise<TrackIdentification | null> {
    const settings = await this.settingsStore.get();

    if (!settings?.apiToken.trim()) {
      throw new Error("AudD API token is not configured.");
    }

    if (settings.provider !== "audd") {
      throw new Error(`Unsupported recognition provider: ${settings.provider}`);
    }

    const wav = encodePcm16Wav(chunk);
    const formData = new FormData();

    formData.append("api_token", settings.apiToken);
    formData.append("file", wav, "audio.wav");

    const response = await fetch(AUDD_ENDPOINT, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(`AudD request failed with HTTP ${response.status}.`);
    }

    const data = await response.json() as AudDResponse;

    if (data.status !== "success") {
      const message = data.error?.error_message ?? "Unknown AudD API error.";
      throw new Error(`AudD API error: ${message}`);
    }

    if (data.result === null) {
      return null;
    }

    const result = data.result;

    if (
      typeof result.title !== "string" ||
      typeof result.artist !== "string"
    ) {
      throw new Error("AudD returned an invalid recognition result.");
    }

    return {
      title: result.title,
      artist: result.artist,
      album: result.album,
      songLink: result.song_link,
      recognisedAt: new Date().toISOString()
    };
  }
}