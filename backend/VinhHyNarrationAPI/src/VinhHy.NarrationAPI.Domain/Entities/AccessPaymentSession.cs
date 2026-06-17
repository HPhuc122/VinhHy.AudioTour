using VinhHy.NarrationAPI.Domain.Common;

namespace VinhHy.NarrationAPI.Domain.Entities;

public class AccessPaymentSession : BaseEntity
{
    public int GuestAccessPassId { get; set; }

    public string Provider { get; set; } = "SimulatedMoMo";

    public string Status { get; set; } = "Pending";

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "VND";

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public DateTime? PaidAt { get; set; }

    public string? FailureReason { get; set; }

    public GuestAccessPass GuestAccessPass { get; set; } = null!;
}
