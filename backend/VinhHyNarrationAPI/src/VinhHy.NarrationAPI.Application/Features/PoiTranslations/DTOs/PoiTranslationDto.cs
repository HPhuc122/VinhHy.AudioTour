namespace VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;

public class PoiTranslationDto
{
    public int Id { get; set; }

    public int POIId { get; set; }

    public string LanguageCode { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string? ShortDescription { get; set; }

    public int Version { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
