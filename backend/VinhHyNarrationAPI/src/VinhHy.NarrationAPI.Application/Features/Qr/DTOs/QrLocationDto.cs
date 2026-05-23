namespace VinhHy.NarrationAPI.Application.Features.Qr.DTOs;

public class QrLocationDto
{
    public int Id { get; set; }

    public int POIId { get; set; }

    public string QRCode { get; set; } = null!;

    public string? Label { get; set; }

    public bool IsActive { get; set; }

    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }
}
