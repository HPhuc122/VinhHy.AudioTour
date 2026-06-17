namespace VinhHy.NarrationAPI.Application.Features.PublicAccess.DTOs;

public class ValidateAccessResponse
{
    public bool IsValid { get; set; }

    public string Status { get; set; } = null!;

    public DateTime? ExpiresAt { get; set; }

    public int RemainingSeconds { get; set; }

    public int? QrLocationId { get; set; }

    public int? PoiId { get; set; }

    public int? TourId { get; set; }
}
