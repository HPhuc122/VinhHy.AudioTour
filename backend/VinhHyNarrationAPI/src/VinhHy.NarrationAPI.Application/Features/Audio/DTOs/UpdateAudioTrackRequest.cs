namespace VinhHy.NarrationAPI.Application.Features.Audio.DTOs;

public class UpdateAudioTrackRequest
{
    public string? Title { get; set; }

    public string? AudioType { get; set; }

    public string? FileUrl { get; set; }

    public string? TTSText { get; set; }

    public int? DurationSeconds { get; set; }

    public long? FileSizeBytes { get; set; }

    public string? MimeType { get; set; }

    public bool? IsActive { get; set; }
}
