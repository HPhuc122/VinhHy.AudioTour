using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface IQrLocationRepository
{
    Task<QrLocation?> GetByIdAsync(int id, bool includeDeleted = false, CancellationToken cancellationToken = default);

    Task<QrLocation?> GetByQrCodeAsync(string qrCode, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<QrLocation>> GetByPoiIdAsync(int poiId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<QrLocation>> GetChangedSinceAsync(
        DateTime since,
        CancellationToken cancellationToken = default);

    Task AddAsync(QrLocation qrLocation, CancellationToken cancellationToken = default);

    void Update(QrLocation qrLocation);

    void SoftDelete(QrLocation qrLocation);
}
