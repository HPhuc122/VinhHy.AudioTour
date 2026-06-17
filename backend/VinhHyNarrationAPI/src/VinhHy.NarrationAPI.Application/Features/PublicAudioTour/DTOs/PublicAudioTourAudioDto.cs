namespace VinhHy.NarrationAPI.Application.Features.PublicAudioTour.DTOs;

public class PublicAudioTourAudioDto
{
    public int Id { get; set; }

    public string LanguageCode { get; set; } = null!;

    public string AudioType { get; set; } = null!;

    public int? DurationSeconds { get; set; }

    public long? FileSizeBytes { get; set; }

    public string? MimeType { get; set; }

    public bool IsAvailable { get; set; }
}
