using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface ITourRepository
{
    Task<Tour?> GetByIdAsync(int id, bool includeDeleted = false, CancellationToken cancellationToken = default);

    Task<Tour?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<Tour> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        bool? isActive = null,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Tour>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default);

    Task AddAsync(Tour tour, CancellationToken cancellationToken = default);

    void Update(Tour tour);

    void SoftDelete(Tour tour);
}
