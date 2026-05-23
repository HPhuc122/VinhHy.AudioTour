using VinhHy.NarrationAPI.Domain.Common;

namespace VinhHy.NarrationAPI.Domain.Entities;

public class AudioTrack : ISoftDeletable, IVersionedEntity, IAuditableEntity
{
    public int Id { get; set; }

    public int POIId { get; set; }

    public string LanguageCode { get; set; } = null!;

    public string AudioType { get; set; } = "tts";

    public string? FileUrl { get; set; }

    public string? TTSText { get; set; }

    public int? DurationSeconds { get; set; }

    public long? FileSizeBytes { get; set; }

    public string? MimeType { get; set; } = "audio/mp4";

    public bool IsActive { get; set; } = true;

    public DateTime? DeletedAt { get; set; }

    public int Version { get; set; } = 1;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Poi Poi { get; set; } = null!;
}
