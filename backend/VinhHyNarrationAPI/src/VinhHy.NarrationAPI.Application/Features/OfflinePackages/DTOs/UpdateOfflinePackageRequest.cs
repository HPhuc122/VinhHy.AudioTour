namespace VinhHy.NarrationAPI.Application.Features.OfflinePackages.DTOs;

public class UpdateOfflinePackageRequest
{
    public string? DownloadUrl { get; set; }

    public long? FileSizeBytes { get; set; }

    public string? Checksum { get; set; }

    public bool? IsActive { get; set; }
}
