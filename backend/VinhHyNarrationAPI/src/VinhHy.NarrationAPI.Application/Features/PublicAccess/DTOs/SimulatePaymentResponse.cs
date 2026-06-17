namespace VinhHy.NarrationAPI.Application.Features.PublicAccess.DTOs;

public class SimulatePaymentResponse
{
    public string Status { get; set; } = null!;

    public string? AccessToken { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public int? QrLocationId { get; set; }

    public int? PoiId { get; set; }

    public int? TourId { get; set; }
}
