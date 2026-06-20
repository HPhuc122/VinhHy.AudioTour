namespace VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;

public class TranslationProviderStatusDto
{
    public string Provider { get; set; } = "Simulated";

    public bool IsSimulated { get; set; } = true;

    public bool IsConfigured { get; set; } = true;
}
