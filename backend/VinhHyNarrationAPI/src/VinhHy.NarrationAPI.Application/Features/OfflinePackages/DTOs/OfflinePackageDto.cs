namespace VinhHy.NarrationAPI.Application.Features.OfflinePackages.DTOs;

public class OfflinePackageDto
{
    public int Id { get; set; }

    public int TourId { get; set; }

    public string LanguageCode { get; set; } = null!;

    public string PackageVersion { get; set; } = null!;

    public string DownloadUrl { get; set; } = null!;

    public long FileSizeBytes { get; set; }

    public string? Checksum { get; set; }

    public bool IsActive { get; set; }

    public DateTime PublishedAt { get; set; }
}
