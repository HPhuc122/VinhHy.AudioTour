using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class SimulatedTranslationProvider : ITranslationProvider
{
    public Task<string> TranslateAsync(
        string sourceText,
        string sourceLanguageCode,
        string targetLanguageCode,
        CancellationToken cancellationToken = default)
    {
        var normalizedTarget = string.IsNullOrWhiteSpace(targetLanguageCode)
            ? "und"
            : targetLanguageCode.Trim().ToLowerInvariant();

        return Task.FromResult($"[{normalizedTarget}] {sourceText}");
    }
}
