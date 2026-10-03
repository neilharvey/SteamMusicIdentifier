using StreamMusicIdentifier.Api.Application;
using StreamMusicIdentifier.Api.Domain;

namespace StreamMusicIdentifier.Api.Infrastructure.Providers;

public sealed class NoOpMusicRecognitionProvider : IMusicRecognitionProvider
{
    public Task<TrackIdentification?> IdentifyAsync(
        AudioRecording recording,
        CancellationToken cancellationToken)
    {
        return Task.FromResult<TrackIdentification?>(null);
    }
}