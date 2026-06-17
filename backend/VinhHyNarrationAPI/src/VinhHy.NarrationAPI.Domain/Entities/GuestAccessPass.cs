using VinhHy.NarrationAPI.Domain.Common;

namespace VinhHy.NarrationAPI.Domain.Entities;

public class GuestAccessPass : BaseEntity
{
    public string? TokenHash { get; set; }

    public int QrLocationId { get; set; }

    public DateTime? StartsAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public bool IsPaid { get; set; }

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "VND";

    public string Status { get; set; } = "PendingPayment";

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public QrLocation QrLocation { get; set; } = null!;

    public ICollection<AccessPaymentSession> PaymentSessions { get; set; } = [];
}
