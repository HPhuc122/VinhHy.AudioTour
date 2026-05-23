namespace VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;

public class CreatePoiTranslationRequest
{
    public int POIId { get; set; }

    public string LanguageCode { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string? ShortDescription { get; set; }
}
