namespace VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

public class SimulatePoiPaymentResponse
{
    public int PaymentSessionId { get; set; }

    public int PoiId { get; set; }

    public string Status { get; set; } = "Pending";

    public PoiDto Poi { get; set; } = null!;
}
