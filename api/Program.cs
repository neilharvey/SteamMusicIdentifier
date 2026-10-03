using StreamMusicIdentifier.Api.Application;
using StreamMusicIdentifier.Api.Endpoints;
using StreamMusicIdentifier.Api.Infrastructure.Providers;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<MusicIdentificationService>();
builder.Services.AddScoped<IMusicRecognitionProvider, NoOpMusicRecognitionProvider>();

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy"
}));

app.MapIdentificationEndpoints();

app.Run();