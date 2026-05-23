namespace VinhHy.AudioTour.Mobile.Core.Models;

public class PoiLocal
{
    public int Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public double RadiusMeters { get; set; } = 30;

    public int Priority { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    public string? ImageUrl { get; set; }

    public string? Category { get; set; }

    public int CooldownSeconds { get; set; } = 300;

    public int MinDwellSeconds { get; set; } = 5;

    public DateTime? DeletedAt { get; set; }

    public int Version { get; set; } = 1;

    public DateTime UpdatedAt { get; set; }

    public DateTime SyncedAt { get; set; }
}
