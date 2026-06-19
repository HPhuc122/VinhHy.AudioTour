namespace VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;

public class GeneratePoiTranslationsResponse
{
    public IReadOnlyList<PoiTranslationDto> Translations { get; set; } = [];

    public IReadOnlyList<string> SkippedLanguageCodes { get; set; } = [];
}
