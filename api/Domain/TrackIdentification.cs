namespace StreamMusicIdentifier.Api.Domain;

public sealed record TrackIdentification(
    string Title,
    string Artist,
    string? Album,
    string? SongLink);