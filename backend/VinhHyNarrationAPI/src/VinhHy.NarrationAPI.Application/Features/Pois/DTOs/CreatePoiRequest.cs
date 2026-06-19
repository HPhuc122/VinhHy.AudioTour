namespace VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

using Microsoft.AspNetCore.Http;
using VinhHy.NarrationAPI.Domain.Entities;

public class CreatePoiRequest
{
    public string Name { get; set; } = string.Empty;

    public string? ShortDescription { get; set; }

    public string? Description { get; set; }

    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;

    public int? UserId { get; set; }

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public decimal RadiusMeters { get; set; } = 30;

    public int Priority { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    public IFormFile? Image { get; set; }

    public List<IFormFile> Images { get; set; } = [];

    public string? Category { get; set; }

    public int CooldownSeconds { get; set; } = 300;

    public int MinDwellSeconds { get; set; } = 5;

    public List<string> SelectedLanguageCodes { get; set; } = [];

    public string? SelectedLanguageCodesJson { get; set; }
}
