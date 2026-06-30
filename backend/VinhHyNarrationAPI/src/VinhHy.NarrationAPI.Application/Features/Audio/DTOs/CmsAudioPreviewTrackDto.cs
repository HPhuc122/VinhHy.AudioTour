namespace VinhHy.NarrationAPI.Application.Features.Audio.DTOs;

public class CmsAudioPreviewTrackDto
{
    public int Id { get; set; }

    public int PoiId { get; set; }

    public string LanguageCode { get; set; } = null!;

    public string? Title { get; set; }

    public string AudioType { get; set; } = null!;

    public int? DurationSeconds { get; set; }

    public long? FileSizeBytes { get; set; }

    public string? MimeType { get; set; }

    public bool IsActive { get; set; }

    public int Version { get; set; }

    public DateTime UpdatedAt { get; set; }
}
