namespace VinhHy.NarrationAPI.Application.Features.Qr.DTOs;

public class QrDto
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public int? PoiId { get; set; }

    public string? PoiCode { get; set; }

    public int? TourId { get; set; }

    public string? TourCode { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }
}
