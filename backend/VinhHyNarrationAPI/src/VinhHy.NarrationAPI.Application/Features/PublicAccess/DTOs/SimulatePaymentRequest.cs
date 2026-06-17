namespace VinhHy.NarrationAPI.Application.Features.PublicAccess.DTOs;

public class SimulatePaymentRequest
{
    public int PaymentSessionId { get; set; }

    public bool Success { get; set; } = true;
}
