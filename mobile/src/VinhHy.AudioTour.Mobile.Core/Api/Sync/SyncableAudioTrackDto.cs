namespace VinhHy.AudioTour.Mobile.Core.Api.Sync;

public class SyncableAudioTrackDto
{
    public int Id { get; set; }

    public int PoiId { get; set; }

    public string LanguageCode { get; set; } = string.Empty;

    public string AudioType { get; set; } = string.Empty;

    public string? FileUrl { get; set; }

    public string? TtsText { get; set; }

    public int? DurationSeconds { get; set; }

    public long? FileSizeBytes { get; set; }

    public string? MimeType { get; set; }

    public bool IsActive { get; set; }

    public int Version { get; set; }

    public DateTime? DeletedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
