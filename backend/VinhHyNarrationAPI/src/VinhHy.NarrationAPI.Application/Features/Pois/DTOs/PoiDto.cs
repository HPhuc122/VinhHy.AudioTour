namespace VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

using VinhHy.NarrationAPI.Domain.Entities;

public class PoiDto
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public string? ShortDescription { get; set; }

    public string? Description { get; set; }

    public ApprovalStatus ApprovalStatus { get; set; }

    public int? UserId { get; set; }

    public string? DisplayName { get; set; }

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public decimal RadiusMeters { get; set; }

    public int Priority { get; set; }

    public bool IsActive { get; set; }

    public PoiLifecycleStatus LifecycleStatus { get; set; }

    public bool PaymentRequired { get; set; }

    public PoiPaymentStatus PaymentStatus { get; set; }

    public DateTime? ActivatedAt { get; set; }

    public DateTime? ValidFrom { get; set; }

    public DateTime? ValidUntil { get; set; }

    public int? ActivatedByUserId { get; set; }

    public string? ImageUrl { get; set; }

    public IReadOnlyList<string> ImageUrls { get; set; } = [];

    public string? Category { get; set; }

    public int CooldownSeconds { get; set; }

    public int MinDwellSeconds { get; set; }

    public int Version { get; set; }

    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
