namespace VinhHy.NarrationAPI.Application.Features.NarrationLogs.DTOs;

public class NarrationLogDto
{
    public long Id { get; set; }

    public int? UserId { get; set; }

    public int POIId { get; set; }

    public string TriggerType { get; set; } = null!;

    public string LanguageCode { get; set; } = null!;

    public DateTime PlayedAt { get; set; }

    public int? DurationPlayedSeconds { get; set; }

    public string? DeviceId { get; set; }

    public bool Synced { get; set; }
}
