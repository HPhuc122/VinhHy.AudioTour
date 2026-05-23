namespace VinhHy.AudioTour.Mobile.Core.Models;

public class DeletedRecordLocal
{
    public long Id { get; set; }

    public string EntityType { get; set; } = string.Empty;

    public int EntityId { get; set; }

    public DateTime DeletedAt { get; set; }

    public DateTime? ProcessedAt { get; set; }
}
