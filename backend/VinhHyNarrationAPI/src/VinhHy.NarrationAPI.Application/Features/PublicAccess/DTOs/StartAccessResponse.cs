using VinhHy.NarrationAPI.Application.Features.Qr.DTOs;

namespace VinhHy.NarrationAPI.Application.Features.PublicAccess.DTOs;

public class StartAccessResponse
{
    public QrDto Qr { get; set; } = null!;

    public bool RequiresPayment { get; set; }

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "VND";

    public int AccessDurationMinutes { get; set; }

    public int? PaymentSessionId { get; set; }

    public string Status { get; set; } = null!;

    public string? AccessToken { get; set; }

    public DateTime? ExpiresAt { get; set; }
}
