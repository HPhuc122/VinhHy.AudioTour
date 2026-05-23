namespace VinhHy.NarrationAPI.Domain.Entities;

public class ContentVersion
{
    public long Id { get; set; }

    public string EntityType { get; set; } = null!;

    public long EntityId { get; set; }

    public int Version { get; set; }

    public string SnapshotJson { get; set; } = null!;

    public int? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public User? CreatedByUser { get; set; }
}
