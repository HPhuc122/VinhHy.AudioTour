namespace VinhHy.NarrationAPI.Domain.Entities;

public class DeletedRecord
{
    public long Id { get; set; }

    public string EntityType { get; set; } = null!;

    public int EntityId { get; set; }

    public DateTime DeletedAt { get; set; }

    public int? DeletedBy { get; set; }

    public User? DeletedByUser { get; set; }
}
