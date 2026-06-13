namespace VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

using Microsoft.AspNetCore.Http;

public class UpdatePoiRequest
{
    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public decimal? RadiusMeters { get; set; }

    public int? Priority { get; set; }

    public bool? IsActive { get; set; }

    public string? ImageUrl { get; set; }

    public IFormFile? Image { get; set; }

    public string? Category { get; set; }

    public int? CooldownSeconds { get; set; }

    public int? MinDwellSeconds { get; set; }
}
