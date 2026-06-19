namespace VinhHy.NarrationAPI.Application.Features.Narrations.DTOs;

public class UploadNarrationAudioRequest
{
    public Stream FileContent { get; set; } = null!;

    public string OriginalFileName { get; set; } = null!;

    public string? ContentType { get; set; }

    public long FileSize { get; set; }

    public string? Title { get; set; }

    public int? DurationSeconds { get; set; }
}
