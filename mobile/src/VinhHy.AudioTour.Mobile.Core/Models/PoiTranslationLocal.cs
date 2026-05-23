namespace VinhHy.AudioTour.Mobile.Core.Models;

public class PoiTranslationLocal
{
    public int Id { get; set; }

    public int PoiId { get; set; }

    public string LanguageCode { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? ShortDescription { get; set; }

    public int Version { get; set; } = 1;

    public DateTime UpdatedAt { get; set; }
}
