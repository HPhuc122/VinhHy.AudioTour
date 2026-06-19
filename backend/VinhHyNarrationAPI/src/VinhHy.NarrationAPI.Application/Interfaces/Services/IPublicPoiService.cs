using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface IPublicPoiService
{
    Task<PagedResult<PublicPoiDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        string? category = null,
        string? languageCode = null,
        CancellationToken cancellationToken = default);

    Task<PublicPoiDto?> GetByIdAsync(
        int id,
        string? languageCode = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyDictionary<int, string?>> GetPrimaryApprovedImageUrlsAsync(
        IReadOnlyCollection<int> poiIds,
        CancellationToken cancellationToken = default);
}
