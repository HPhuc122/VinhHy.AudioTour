using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Entities;

[Table("AudioTracks")]
public class AudioTrackEntity
{
    [PrimaryKey]
    [Column("Id")]
    public int Id { get; set; }

    [Column("POIId")]
    public int PoiId { get; set; }

    [Column("LanguageCode")]
    public string LanguageCode { get; set; } = string.Empty;

    [Column("AudioType")]
    public string AudioType { get; set; } = "tts";

    [Column("FileUrl")]
    public string? FileUrl { get; set; }

    [Column("TTSText")]
    public string? TtsText { get; set; }

    [Column("DurationSeconds")]
    public int? DurationSeconds { get; set; }

    [Column("FileSizeBytes")]
    public long? FileSizeBytes { get; set; }

    [Column("MimeType")]
    public string? MimeType { get; set; } = "audio/mp4";

    [Column("IsActive")]
    public bool IsActive { get; set; } = true;

    [Column("IsDownloaded")]
    public bool IsDownloaded { get; set; }

    [Column("LocalFilePath")]
    public string? LocalFilePath { get; set; }

    [Column("DeletedAt")]
    public DateTime? DeletedAt { get; set; }

    [Column("Version")]
    public int Version { get; set; } = 1;

    [Column("UpdatedAt")]
    public DateTime UpdatedAt { get; set; }
}
