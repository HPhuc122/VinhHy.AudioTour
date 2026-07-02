namespace VinhHy.NarrationAPI.Application.Features.PublicRoutes.DTOs;

public class PoiToPoiRouteDto
{
    public int FromPoiId { get; set; }

    public int ToPoiId { get; set; }

    public double DirectDistanceMeters { get; set; }

    public double RouteDistanceMeters { get; set; }

    public double DurationSeconds { get; set; }

    public IReadOnlyList<RouteLatLngDto> LatLngs { get; set; } = [];
}
