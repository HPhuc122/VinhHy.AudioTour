namespace VinhHy.NarrationAPI.Application.Features.Narrations.DTOs;

public class GenerateNarrationTranslationsRequest
{
    public List<string> TargetLanguageCodes { get; set; } = [];

    public bool OverwriteExisting { get; set; }
}
