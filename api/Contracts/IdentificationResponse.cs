
namespace StreamMusicIdentifier.Api.Contracts;

public sealed record IdentificationResponse(
    TrackResponse? Track);

public sealed record TrackResponse(
    string Title,
    string Artist,
    string? Album,
    string? SongLink);