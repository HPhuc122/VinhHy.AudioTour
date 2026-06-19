namespace VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

using Microsoft.AspNetCore.Http;

public class UpdatePoiRequest
{
    public string? Name { get; set; }

    public string? ShortDescription { get; set; }

    public string? Description { get; set; }

    public int? UserId { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public decimal? RadiusMeters { get; set; }

    public int? Priority { get; set; }

    public bool? IsActive { get; set; }

    public string? ImageUrl { get; set; }

    public IFormFile? Image { get; set; }

    public List<IFormFile> Images { get; set; } = [];

    public string? Category { get; set; }

    public int? CooldownSeconds { get; set; }

    public int? MinDwellSeconds { get; set; }

    public bool ReTranslateAdditionalLanguages { get; set; } = true;
}
