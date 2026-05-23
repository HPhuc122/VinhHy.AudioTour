namespace VinhHy.NarrationAPI.Domain.Entities;

public class AuditLog
{
    public long Id { get; set; }

    public int? UserId { get; set; }

    public string TableName { get; set; } = null!;

    public string RecordId { get; set; } = null!;

    public string Action { get; set; } = null!;

    public string? OldValues { get; set; }

    public string? NewValues { get; set; }

    public string? IPAddress { get; set; }

    public DateTime CreatedAt { get; set; }

    public User? User { get; set; }
}
