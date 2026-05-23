namespace VinhHy.AudioTour.Mobile.Core.Api.Sync;

public class SyncNarrationLogItem
{
    public int PoiId { get; set; }

    public string TriggerType { get; set; } = string.Empty;

    public string LanguageCode { get; set; } = string.Empty;

    public DateTime PlayedAt { get; set; }

    public int? DurationPlayedSeconds { get; set; }

    public string? DeviceId { get; set; }
}
