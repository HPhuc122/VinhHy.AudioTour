using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Data.Database;
using VinhHy.AudioTour.Mobile.Data.Entities;
using VinhHy.AudioTour.Mobile.Data.Mapping;

namespace VinhHy.AudioTour.Mobile.Data.Repositories;

public sealed class LocalSettingsRepository(LocalDatabase database) : ILocalSettingsRepository
{
    public Task<LocalSettingEntry?> GetAsync(string key, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entity = await connection.FindAsync<LocalSettingEntity>(key).ConfigureAwait(false);
                return entity is null ? null : EntityMapper.ToLocal(entity);
            },
            cancellationToken);

    public Task SetAsync(LocalSettingEntry entry, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            connection => connection.InsertOrReplaceAsync(EntityMapper.FromLocal(entry)),
            cancellationToken);

    public Task DeleteAsync(string key, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            connection => connection.DeleteAsync<LocalSettingEntity>(key),
            cancellationToken);
}
