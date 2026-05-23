namespace VinhHy.AudioTour.Mobile.Core.Models;

public class OfflinePackageLocal
{
    public int Id { get; set; }

    public int TourId { get; set; }

    public string LanguageCode { get; set; } = string.Empty;

    public string PackageVersion { get; set; } = string.Empty;

    public string DownloadUrl { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; }

    public string? Checksum { get; set; }

    public bool IsDownloaded { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime? DownloadedAt { get; set; }

    public DateTime PublishedAt { get; set; }
}
