namespace VinhHy.AudioTour.Mobile.Core.Api.Sync;

public class SyncableOfflinePackageDto
{
    public int Id { get; set; }

    public int TourId { get; set; }

    public string LanguageCode { get; set; } = string.Empty;

    public string PackageVersion { get; set; } = string.Empty;

    public string DownloadUrl { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; }

    public string? Checksum { get; set; }

    public bool IsActive { get; set; }

    public DateTime PublishedAt { get; set; }
}
