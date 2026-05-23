namespace VinhHy.NarrationAPI.Application.Features.Sync.DTOs;

public class SyncNarrationLogItem
{
    public int POIId { get; set; }

    public string TriggerType { get; set; } = null!;

    public string LanguageCode { get; set; } = null!;

    public DateTime PlayedAt { get; set; }

    public int? DurationPlayedSeconds { get; set; }

    public string? DeviceId { get; set; }
}
