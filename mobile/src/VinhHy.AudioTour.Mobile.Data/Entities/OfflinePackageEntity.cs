using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Entities;

[Table("OfflinePackages")]
public class OfflinePackageEntity
{
    [PrimaryKey]
    [Column("Id")]
    public int Id { get; set; }

    [Column("TourId")]
    public int TourId { get; set; }

    [Column("LanguageCode")]
    public string LanguageCode { get; set; } = string.Empty;

    [Column("PackageVersion")]
    public string PackageVersion { get; set; } = string.Empty;

    [Column("DownloadUrl")]
    public string DownloadUrl { get; set; } = string.Empty;

    [Column("FileSizeBytes")]
    public long FileSizeBytes { get; set; }

    [Column("Checksum")]
    public string? Checksum { get; set; }

    [Column("IsDownloaded")]
    public bool IsDownloaded { get; set; }

    [Column("IsActive")]
    public bool IsActive { get; set; } = true;

    [Column("DownloadedAt")]
    public DateTime? DownloadedAt { get; set; }

    [Column("PublishedAt")]
    public DateTime PublishedAt { get; set; }
}
