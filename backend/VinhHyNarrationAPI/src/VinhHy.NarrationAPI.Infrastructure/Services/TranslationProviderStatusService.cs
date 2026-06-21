using Microsoft.Extensions.Options;
using VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Infrastructure.Options;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class TranslationProviderStatusService(IOptions<TranslationOptions> options) : ITranslationProviderStatusService
{
    public TranslationProviderStatusDto GetStatus()
    {
        var provider = TranslationProviderNames.Normalize(options.Value.Provider);
        var isSimulated = provider == TranslationProviderNames.Simulated;

        return new TranslationProviderStatusDto
        {
            Provider = provider,
            IsSimulated = isSimulated,
            IsConfigured = isSimulated || GoogleTranslateProvider.IsConfigured(options.Value.GoogleTranslate)
        };
    }
}

internal static class TranslationProviderNames
{
    public const string Simulated = "Simulated";
    public const string GoogleTranslate = "GoogleTranslate";

    public static string Normalize(string? provider)
    {
        if (string.Equals(provider, GoogleTranslate, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(provider, "Google", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(provider, "GoogleCloudTranslate", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(provider, "RealApi", StringComparison.OrdinalIgnoreCase))
        {
            return GoogleTranslate;
        }

        return Simulated;
    }
}
