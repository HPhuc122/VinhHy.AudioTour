namespace VinhHy.NarrationAPI.Application.Features.Narrations.DTOs;

public class NarrationDraftDto
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public string LanguageCode { get; set; } = null!;

    public string TextContent { get; set; } = null!;

    public string Voice { get; set; } = null!;

    public int PoiId { get; set; }

    public string? PoiCode { get; set; }

    public string? PoiName { get; set; }

    public string Status { get; set; } = null!;

    public int SubmittedByUserId { get; set; }

    public string? SubmittedByUsername { get; set; }

    public DateTime SubmittedAt { get; set; }

    public int? ReviewedByUserId { get; set; }

    public string? ReviewedByUsername { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public string? RejectionReason { get; set; }

    public int? GeneratedAudioTrackId { get; set; }

    public int? GeneratedAudioDurationSeconds { get; set; }

    public DateTime? AudioGeneratedAt { get; set; }

    public string? SimulatedAudioUrl { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
