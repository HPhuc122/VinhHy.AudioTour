using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface IQrRepository
{
    Task<IReadOnlyList<QrLocation>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<QrLocation?> GetByIdAsync(int id, bool includeDeleted = false, CancellationToken cancellationToken = default);

    Task<QrLocation?> GetByCodeAsync(
        string code,
        bool activeOnly = false,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default);

    Task<int> CountAsync(
        bool? isActive = null,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<QrLocation>> GetActiveServiceLevelAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<QrLocation>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default);

    Task AddAsync(QrLocation qrLocation, CancellationToken cancellationToken = default);

    void Update(QrLocation qrLocation);

    void SoftDelete(QrLocation qrLocation);
}
