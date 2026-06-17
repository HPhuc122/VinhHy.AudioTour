using VinhHy.NarrationAPI.Domain.Common;

namespace VinhHy.NarrationAPI.Domain.Entities;

public class QrLocation : BaseEntity, ISoftDeletable
{
    public string Code { get; set; } = null!;

    public int? PoiId { get; set; }

    public int? TourId { get; set; }

    public bool IsActive { get; set; } = true;

    public bool RequiresPayment { get; set; }

    public decimal PriceAmount { get; set; }

    public int AccessDurationMinutes { get; set; } = 60;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public Poi? Poi { get; set; }

    public Tour? Tour { get; set; }

    public ICollection<GuestAccessPass> GuestAccessPasses { get; set; } = [];
}
