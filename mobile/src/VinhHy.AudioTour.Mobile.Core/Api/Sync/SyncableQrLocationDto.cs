namespace VinhHy.AudioTour.Mobile.Core.Api.Sync;

public class SyncableQrLocationDto
{
    public int Id { get; set; }

    public int PoiId { get; set; }

    public string QrCode { get; set; } = string.Empty;

    public string? Label { get; set; }

    public bool IsActive { get; set; }

    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }
}
