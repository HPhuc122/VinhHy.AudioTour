namespace VinhHy.NarrationAPI.Application.Features.Media.DTOs;

public class MediaFileDto
{
    public int Id { get; set; }

    public string FileName { get; set; } = null!;

    public string OriginalFileName { get; set; } = null!;

    public string FileType { get; set; } = null!;

    public string ContentType { get; set; } = null!;

    public long FileSize { get; set; }

    public string RelativePath { get; set; } = null!;

    public string? PublicUrl { get; set; }

    public DateTime UploadedAt { get; set; }

    public int? UploadedByUserId { get; set; }

    public string? UploadedByUsername { get; set; }

    public int? PoiId { get; set; }

    public string? ImageCategory { get; set; }

    public string? PoiCode { get; set; }

    public string? PoiName { get; set; }

    public string ApprovalStatus { get; set; } = null!;

    public DateTime? SubmittedAt { get; set; }

    public int? ReviewedByUserId { get; set; }

    public string? ReviewedByUsername { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public string? RejectionReason { get; set; }

    public bool IsDeleted { get; set; }
}
