namespace VinhHy.NarrationAPI.Application.Features.Sync.DTOs;

public class SyncablePoiTranslationDto
{
    public int Id { get; set; }

    public int POIId { get; set; }

    public string LanguageCode { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string? ShortDescription { get; set; }

    public int Version { get; set; }

    public DateTime UpdatedAt { get; set; }
}
