namespace VinhHy.AudioTour.Mobile.Core.Models;

public class AudioTrackLocal
{
    public int Id { get; set; }

    public int PoiId { get; set; }

    public string LanguageCode { get; set; } = string.Empty;

    public string AudioType { get; set; } = "tts";

    public string? FileUrl { get; set; }

    public string? TtsText { get; set; }

    public int? DurationSeconds { get; set; }

    public long? FileSizeBytes { get; set; }

    public string? MimeType { get; set; } = "audio/mp4";

    public bool IsActive { get; set; } = true;

    public bool IsDownloaded { get; set; }

    public string? LocalFilePath { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int Version { get; set; } = 1;

    public DateTime UpdatedAt { get; set; }
}
