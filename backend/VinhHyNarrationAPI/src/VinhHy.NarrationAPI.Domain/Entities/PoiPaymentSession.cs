using VinhHy.NarrationAPI.Domain.Common;

namespace VinhHy.NarrationAPI.Domain.Entities;

public class PoiPaymentSession : BaseEntity
{
    public int PoiId { get; set; }

    public int VendorUserId { get; set; }

    public string Provider { get; set; } = "SimulatedMoMo";

    public string Status { get; set; } = "Pending";

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "VND";

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public DateTime? PaidAt { get; set; }

    public string? FailureReason { get; set; }

    public Poi Poi { get; set; } = null!;

    public User VendorUser { get; set; } = null!;
}
