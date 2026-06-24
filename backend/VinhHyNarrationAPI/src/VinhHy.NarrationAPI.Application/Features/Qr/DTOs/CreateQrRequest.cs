namespace VinhHy.NarrationAPI.Application.Features.Qr.DTOs;

public class CreateQrRequest
{
    public string? Name { get; set; }

    public string? QrKind { get; set; }

    public string? Code { get; set; }

    public int? PoiId { get; set; }

    public int? TourId { get; set; }

    public bool IsActive { get; set; } = true;

    public bool RequiresPayment { get; set; }

    public decimal PriceAmount { get; set; }

    public int AccessDurationMinutes { get; set; } = 60;
}
