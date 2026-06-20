using Microsoft.Extensions.Options;
using VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Infrastructure.Options;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class TranslationProviderStatusService(IOptions<TranslationOptions> options) : ITranslationProviderStatusService
{
    public TranslationProviderStatusDto GetStatus()
    {
        var provider = NormalizeProvider(options.Value.Provider);
        var isSimulated = provider == TranslationProviderNames.Simulated;

        return new TranslationProviderStatusDto
        {
            Provider = provider,
            IsSimulated = isSimulated,
            IsConfigured = isSimulated || RealApiTranslationProvider.IsConfigured(options.Value.RealApi)
        };
    }

    private static string NormalizeProvider(string? provider)
    {
        return string.Equals(provider, TranslationProviderNames.RealApi, StringComparison.OrdinalIgnoreCase)
            ? TranslationProviderNames.RealApi
            : TranslationProviderNames.Simulated;
    }
}

internal static class TranslationProviderNames
{
    public const string Simulated = "Simulated";
    public const string RealApi = "RealApi";
}
