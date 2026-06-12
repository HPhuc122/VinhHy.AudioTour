namespace VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

public class PoiDto
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string? DisplayName { get; set; }

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public decimal RadiusMeters { get; set; }

    public int Priority { get; set; }

    public bool IsActive { get; set; }

    public string? ImageUrl { get; set; }

    public string? Category { get; set; }

    public int CooldownSeconds { get; set; }

    public int MinDwellSeconds { get; set; }

    public int Version { get; set; }

    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
