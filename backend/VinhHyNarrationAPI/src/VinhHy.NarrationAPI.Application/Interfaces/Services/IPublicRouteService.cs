using VinhHy.NarrationAPI.Application.Features.PublicRoutes.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IPublicRouteService
{
    Task<PoiToPoiRouteDto> GetPoiToPoiRouteAsync(
        int fromPoiId,
        int toPoiId,
        CancellationToken cancellationToken = default);
}
