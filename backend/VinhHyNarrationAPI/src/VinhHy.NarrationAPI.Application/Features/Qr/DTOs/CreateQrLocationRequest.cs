namespace VinhHy.NarrationAPI.Application.Features.Qr.DTOs;

public class CreateQrLocationRequest
{
    public int POIId { get; set; }

    public string QRCode { get; set; } = null!;

    public string? Label { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime? ExpiresAt { get; set; }
}
