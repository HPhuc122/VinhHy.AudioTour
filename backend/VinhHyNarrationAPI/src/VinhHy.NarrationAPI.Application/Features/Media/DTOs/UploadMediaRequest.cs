namespace VinhHy.NarrationAPI.Application.Features.Media.DTOs;

public class UploadMediaRequest
{
    public Stream FileContent { get; set; } = null!;

    public string OriginalFileName { get; set; } = null!;

    public string ContentType { get; set; } = null!;

    public long FileSize { get; set; }

    public int? UploadedByUserId { get; set; }
}
