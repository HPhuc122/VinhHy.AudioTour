namespace VinhHy.NarrationAPI.Application.Features.Qr.DTOs;

public class UpdateQrLocationRequest
{
    public string? Label { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? ExpiresAt { get; set; }
}
