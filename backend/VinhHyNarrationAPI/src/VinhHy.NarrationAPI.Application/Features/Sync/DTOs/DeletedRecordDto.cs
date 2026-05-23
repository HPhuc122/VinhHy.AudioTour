namespace VinhHy.NarrationAPI.Application.Features.Sync.DTOs;

public class DeletedRecordDto
{
    public long Id { get; set; }

    public string EntityType { get; set; } = null!;

    public int EntityId { get; set; }

    public DateTime DeletedAt { get; set; }
}
