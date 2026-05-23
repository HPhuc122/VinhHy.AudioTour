using AutoMapper;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Geofence.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class GeofenceConfigService : IGeofenceConfigService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public GeofenceConfigService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<GeofenceConfigDto?> GetByPoiIdAsync(int poiId, CancellationToken cancellationToken = default)
    {
        var poi = await _uow.Pois.GetByIdAsync(poiId, cancellationToken: cancellationToken).ConfigureAwait(false);
        return poi is null ? null : _mapper.Map<GeofenceConfigDto>(poi);
    }

    public async Task<GeofenceConfigDto> UpdateAsync(
        int poiId,
        UpdateGeofenceConfigRequest request,
        CancellationToken cancellationToken = default)
    {
        var poi = await _uow.Pois.GetByIdAsync(poiId, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Poi), poiId);

        if (request.RadiusMeters.HasValue) poi.RadiusMeters = request.RadiusMeters.Value;
        if (request.CooldownSeconds.HasValue) poi.CooldownSeconds = request.CooldownSeconds.Value;
        if (request.MinDwellSeconds.HasValue) poi.MinDwellSeconds = request.MinDwellSeconds.Value;

        poi.Version++;
        poi.UpdatedAt = DateTime.UtcNow;
        _uow.Pois.Update(poi);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<GeofenceConfigDto>(poi);
    }
}
