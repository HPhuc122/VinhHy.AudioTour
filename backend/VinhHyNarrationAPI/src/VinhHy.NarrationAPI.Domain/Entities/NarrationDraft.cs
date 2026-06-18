using VinhHy.NarrationAPI.Domain.Common;
using VinhHy.NarrationAPI.Domain.Constants;

namespace VinhHy.NarrationAPI.Domain.Entities;

public class NarrationDraft : IAuditableEntity
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public string LanguageCode { get; set; } = "vi";

    public string TextContent { get; set; } = null!;

    public string Voice { get; set; } = null!;

    public string Status { get; set; } = NarrationDraftStatuses.Pending;

    public int SubmittedByUserId { get; set; }

    public DateTime SubmittedAt { get; set; }

    public int? ReviewedByUserId { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public string? RejectionReason { get; set; }

    public int? GeneratedAudioTrackId { get; set; }

    public DateTime? AudioGeneratedAt { get; set; }

    public string? SimulatedAudioUrl { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public User SubmittedByUser { get; set; } = null!;

    public User? ReviewedByUser { get; set; }

    public AudioTrack? GeneratedAudioTrack { get; set; }
}
