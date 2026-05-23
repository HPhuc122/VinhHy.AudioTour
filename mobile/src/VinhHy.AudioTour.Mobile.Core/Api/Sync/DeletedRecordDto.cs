namespace VinhHy.AudioTour.Mobile.Core.Api.Sync;

public class DeletedRecordDto
{
    public long Id { get; set; }

    public string EntityType { get; set; } = string.Empty;

    public int EntityId { get; set; }

    public DateTime DeletedAt { get; set; }
}
