using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Data.Database;
using VinhHy.AudioTour.Mobile.Data.Entities;
using VinhHy.AudioTour.Mobile.Data.Mapping;

namespace VinhHy.AudioTour.Mobile.Data.Repositories;

public sealed class QrLocationRepository(LocalDatabase database) : IQrLocationRepository
{
    public Task<QrLocationLocal?> GetByCodeAsync(string qrCode, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entity = await connection.Table<QrLocationEntity>()
                    .Where(q => q.QRCode == qrCode && q.DeletedAt == null && q.IsActive)
                    .FirstOrDefaultAsync()
                    .ConfigureAwait(false);
                return entity is null ? null : EntityMapper.ToLocal(entity);
            },
            cancellationToken);

    public Task UpsertRangeAsync(IEnumerable<QrLocationLocal> locations, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                await connection.RunInTransactionAsync(transaction =>
                {
                    foreach (var location in locations)
                    {
                        transaction.InsertOrReplace(EntityMapper.FromLocal(location));
                    }
                }).ConfigureAwait(false);
            },
            cancellationToken);

    public Task DeleteAsync(int id, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            connection => connection.DeleteAsync<QrLocationEntity>(id),
            cancellationToken);
}
