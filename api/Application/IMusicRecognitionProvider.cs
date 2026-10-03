using StreamMusicIdentifier.Api.Domain;

namespace StreamMusicIdentifier.Api.Application;

public interface IMusicRecognitionProvider
{
    Task<TrackIdentification?> IdentifyAsync(
        AudioRecording recording,
        CancellationToken cancellationToken);
}