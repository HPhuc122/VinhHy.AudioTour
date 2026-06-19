namespace VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

public class SimulatePoiPaymentRequest
{
    public int PaymentSessionId { get; set; }

    public bool Success { get; set; } = true;
}
