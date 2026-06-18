using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface IPoiRepository
{
    Task<Poi?> GetByIdAsync(int id, bool includeDeleted = false, CancellationToken cancellationToken = default);

    Task<Poi?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<Poi> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        string? category = null,
        bool? isActive = null,
        ApprovalStatus? approvalStatus = null,
        int? ownerUserId = null,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Poi>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Poi>> GetActiveInBoundsAsync(
        decimal minLat,
        decimal maxLat,
        decimal minLon,
        decimal maxLon,
        CancellationToken cancellationToken = default);

    Task AddAsync(Poi poi, CancellationToken cancellationToken = default);

    void Update(Poi poi);

    void SoftDelete(Poi poi);
}
