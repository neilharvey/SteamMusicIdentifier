namespace StreamMusicIdentifier.Api.Domain;

public sealed record AudioRecording(
    byte[] Data,
    string ContentType);