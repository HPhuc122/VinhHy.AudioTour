namespace VinhHy.NarrationAPI.Application.Features.Sync.DTOs;

public class SyncableTourDto
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string DefaultLanguage { get; set; } = "vi";

    public bool IsActive { get; set; }

    public int? EstimatedMinutes { get; set; }

    public int Version { get; set; }

    public DateTime? DeletedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
