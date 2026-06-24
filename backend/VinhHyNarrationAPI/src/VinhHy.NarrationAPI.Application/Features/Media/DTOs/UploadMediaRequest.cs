namespace VinhHy.NarrationAPI.Application.Features.Media.DTOs;

public class UploadMediaRequest
{
    public Stream FileContent { get; set; } = null!;

    public string OriginalFileName { get; set; } = null!;

    public string ContentType { get; set; } = null!;

    public long FileSize { get; set; }

    public int? UploadedByUserId { get; set; }

    public int? PoiId { get; set; }

    public string? ImageCategory { get; set; }

    public int? RequiredPoiOwnerUserId { get; set; }

    public bool ImageOnly { get; set; }

    public string? ApprovalStatus { get; set; }

    public int? ReviewedByUserId { get; set; }
}
