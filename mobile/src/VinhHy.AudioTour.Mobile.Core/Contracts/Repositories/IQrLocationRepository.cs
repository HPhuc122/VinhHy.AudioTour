using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;

public interface IQrLocationRepository
{
    Task<QrLocationLocal?> GetByCodeAsync(string qrCode, CancellationToken cancellationToken = default);

    Task UpsertRangeAsync(IEnumerable<QrLocationLocal> locations, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
