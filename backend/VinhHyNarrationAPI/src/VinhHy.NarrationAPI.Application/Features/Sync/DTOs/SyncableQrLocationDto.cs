namespace VinhHy.NarrationAPI.Application.Features.Sync.DTOs;

public class SyncableQrLocationDto
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public int? PoiId { get; set; }

    public int? TourId { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }
}
