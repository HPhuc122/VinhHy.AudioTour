namespace VinhHy.NarrationAPI.Application.Features.Geofence.DTOs;

public class UpdateGeofenceConfigRequest
{
    public decimal? RadiusMeters { get; set; }

    public int? Priority { get; set; }

    public int? CooldownSeconds { get; set; }

    public int? MinDwellSeconds { get; set; }

    public bool? IsActive { get; set; }
}
