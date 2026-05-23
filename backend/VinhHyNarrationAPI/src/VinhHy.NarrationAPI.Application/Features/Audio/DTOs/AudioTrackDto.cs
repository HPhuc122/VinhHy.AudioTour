namespace VinhHy.NarrationAPI.Application.Features.Audio.DTOs;

public class AudioTrackDto
{
    public int Id { get; set; }

    public int POIId { get; set; }

    public string LanguageCode { get; set; } = null!;

    public string AudioType { get; set; } = null!;

    public string? FileUrl { get; set; }

    public string? TTSText { get; set; }

    public int? DurationSeconds { get; set; }

    public long? FileSizeBytes { get; set; }

    public string? MimeType { get; set; }

    public bool IsActive { get; set; }

    public int Version { get; set; }

    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
