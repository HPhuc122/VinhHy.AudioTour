namespace VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;

public class GeneratePoiTranslationsRequest
{
    public int PoiId { get; set; }

    public string SourceLanguageCode { get; set; } = "vi";

    public List<string> TargetLanguageCodes { get; set; } = [];

    public bool OverwriteExisting { get; set; }
}
