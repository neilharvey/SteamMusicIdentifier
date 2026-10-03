using Microsoft.AspNetCore.Mvc;
using StreamMusicIdentifier.Api.Application;
using StreamMusicIdentifier.Api.Contracts;
using StreamMusicIdentifier.Api.Domain;

namespace StreamMusicIdentifier.Api.Endpoints;

public static class IdentificationsEndpoints
{
    public static IEndpointRouteBuilder MapIdentificationEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/v1/identifications", IdentifyAsync)
            .DisableAntiforgery()
            .WithName("IdentifyMusic");

        return endpoints;
    }

    private static async Task<IResult> IdentifyAsync(
        IFormFile? audio,
        MusicIdentificationService identificationService,
        CancellationToken cancellationToken)
    {
        if (audio is null || audio.Length == 0)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Missing audio",
                detail: "A non-empty audio file is required.");
        }

        const long maxFileSize = 5 * 1024 * 1024;

        if (audio.Length > maxFileSize)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status413PayloadTooLarge,
                title: "Audio file too large",
                detail: "The audio file must not exceed 5 MB.");
        }

        if (audio.ContentType != "audio/wav")
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Unsupported audio format",
                detail: "The audio file must be WAV.");
        }

        await using var stream = audio.OpenReadStream();
        using var memoryStream = new MemoryStream();

        await stream.CopyToAsync(memoryStream, cancellationToken);

        var recording = new AudioRecording(
            memoryStream.ToArray(),
            audio.ContentType);

        var identification = await identificationService.IdentifyAsync(
            recording,
            cancellationToken);

        var response = new IdentificationResponse(
            identification is null
                ? null
                : new TrackResponse(
                    identification.Title,
                    identification.Artist,
                    identification.Album,
                    identification.SongLink));

        return Results.Ok(response);
    }
}