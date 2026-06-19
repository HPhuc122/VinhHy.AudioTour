namespace VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

public class StartPoiPaymentResponse
{
    public int PaymentSessionId { get; set; }

    public int PoiId { get; set; }

    public string Provider { get; set; } = "SimulatedMoMo";

    public string Status { get; set; } = "Pending";

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "VND";

    public DateTime ExpiresAt { get; set; }
}
