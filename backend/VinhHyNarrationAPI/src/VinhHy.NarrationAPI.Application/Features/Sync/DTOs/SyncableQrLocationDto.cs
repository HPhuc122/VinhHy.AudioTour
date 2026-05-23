namespace VinhHy.NarrationAPI.Application.Features.Sync.DTOs;

public class SyncableQrLocationDto
{
    public int Id { get; set; }

    public int POIId { get; set; }

    public string QRCode { get; set; } = null!;

    public string? Label { get; set; }

    public bool IsActive { get; set; }

    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }
}
