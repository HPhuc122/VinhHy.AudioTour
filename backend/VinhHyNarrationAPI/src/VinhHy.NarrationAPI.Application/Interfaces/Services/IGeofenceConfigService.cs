using VinhHy.NarrationAPI.Application.Features.Geofence.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IGeofenceConfigService
{
    Task<GeofenceConfigDto?> GetByPoiIdAsync(int poiId, CancellationToken cancellationToken = default);

    Task<GeofenceConfigDto> UpdateAsync(
        int poiId,
        UpdateGeofenceConfigRequest request,
        CancellationToken cancellationToken = default);
}
