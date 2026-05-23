namespace VinhHy.AudioTour.Mobile.Core.Api.Sync;

public class SyncableTourTranslationDto
{
    public int Id { get; set; }

    public int TourId { get; set; }

    public string LanguageCode { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
}
