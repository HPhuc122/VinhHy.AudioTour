namespace VinhHy.NarrationAPI.Application.Features.Narrations.DTOs;

public class GenerateNarrationTranslationsResponse
{
    public IReadOnlyList<NarrationDraftDto> Narrations { get; set; } = [];

    public IReadOnlyList<string> SkippedLanguageCodes { get; set; } = [];
}
