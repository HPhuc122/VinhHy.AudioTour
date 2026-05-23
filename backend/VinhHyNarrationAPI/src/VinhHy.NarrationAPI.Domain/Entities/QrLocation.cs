using VinhHy.NarrationAPI.Domain.Common;

namespace VinhHy.NarrationAPI.Domain.Entities;

public class QrLocation : BaseEntity, ISoftDeletable
{
    public int POIId { get; set; }

    public string QRCode { get; set; } = null!;

    public string? Label { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public Poi Poi { get; set; } = null!;
}
