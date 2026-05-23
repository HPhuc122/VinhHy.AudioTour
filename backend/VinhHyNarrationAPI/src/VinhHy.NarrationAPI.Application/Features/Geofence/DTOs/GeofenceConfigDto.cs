namespace VinhHy.NarrationAPI.Application.Features.Geofence.DTOs;

public class GeofenceConfigDto
{
    public int POIId { get; set; }

    public string PoiCode { get; set; } = null!;

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public decimal RadiusMeters { get; set; }

    public int Priority { get; set; }

    public int CooldownSeconds { get; set; }

    public int MinDwellSeconds { get; set; }

    public bool IsActive { get; set; }

    public int Version { get; set; }

    public DateTime UpdatedAt { get; set; }
}
