namespace VinhHy.AudioTour.Mobile.Core.Models;

public class NarrationLogLocal
{
    public long Id { get; set; }

    public int? ServerId { get; set; }

    public int PoiId { get; set; }

    public string TriggerType { get; set; } = string.Empty;

    public string LanguageCode { get; set; } = string.Empty;

    public DateTime PlayedAt { get; set; }

    public int? DurationPlayedSeconds { get; set; }

    public string? DeviceId { get; set; }

    public bool Synced { get; set; }

    public DateTime? SyncedAt { get; set; }
}
