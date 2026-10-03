using StreamMusicIdentifier.Api.Domain;

namespace StreamMusicIdentifier.Api.Application;

public sealed class MusicIdentificationService(
    IMusicRecognitionProvider provider)
{
    public Task<TrackIdentification?> IdentifyAsync(
        AudioRecording recording,
        CancellationToken cancellationToken)
    {
        return provider.IdentifyAsync(
            recording,
            cancellationToken);
    }
}