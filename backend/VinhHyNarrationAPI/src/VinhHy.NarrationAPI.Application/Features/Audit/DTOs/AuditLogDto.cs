namespace VinhHy.NarrationAPI.Application.Features.Audit.DTOs;

public class AuditLogDto
{
    public long Id { get; set; }

    public int? UserId { get; set; }

    public string? Username { get; set; }

    public string TableName { get; set; } = null!;

    public string RecordId { get; set; } = null!;

    public string Action { get; set; } = null!;

    public string? OldValues { get; set; }

    public string? NewValues { get; set; }

    public string? IPAddress { get; set; }

    public DateTime CreatedAt { get; set; }
}
