namespace VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

using Microsoft.AspNetCore.Http;

public class CreatePoiRequest
{
    public string Code { get; set; } = null!;

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public decimal RadiusMeters { get; set; } = 30;

    public int Priority { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    public IFormFile? Image { get; set; }

    public string? Category { get; set; }

    public int CooldownSeconds { get; set; } = 300;

    public int MinDwellSeconds { get; set; } = 5;
}
