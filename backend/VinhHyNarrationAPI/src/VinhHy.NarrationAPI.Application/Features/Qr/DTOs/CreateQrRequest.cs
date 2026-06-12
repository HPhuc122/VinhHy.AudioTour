namespace VinhHy.NarrationAPI.Application.Features.Qr.DTOs;

public class CreateQrRequest
{
    public string? Code { get; set; }

    public int? PoiId { get; set; }

    public int? TourId { get; set; }

    public bool IsActive { get; set; } = true;
}
