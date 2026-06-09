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

    public DateTime UploadedAt { get; set; }

    public int? UploadedByUserId { get; set; }

    public bool IsDeleted { get; set; }
}
