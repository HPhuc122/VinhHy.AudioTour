namespace VinhHy.NarrationAPI.Application.Features.Sync.DTOs;

public class SyncableTourTranslationDto
{
    public int Id { get; set; }

    public int TourId { get; set; }

    public string LanguageCode { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }
}
