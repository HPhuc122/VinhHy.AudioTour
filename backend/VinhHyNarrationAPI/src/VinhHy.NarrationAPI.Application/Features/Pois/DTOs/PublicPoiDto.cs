namespace VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

public class PublicPoiDto
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? ShortDescription { get; set; }

    public string? Description { get; set; }

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public decimal RadiusMeters { get; set; }

    public int Priority { get; set; }

    public string? Category { get; set; }

    public string? ImageUrl { get; set; }

    public IReadOnlyList<string> ImageUrls { get; set; } = [];

    public int CooldownSeconds { get; set; }

    public int MinDwellSeconds { get; set; }
}
