using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Data.Database;
using VinhHy.AudioTour.Mobile.Data.Entities;
using VinhHy.AudioTour.Mobile.Data.Mapping;

namespace VinhHy.AudioTour.Mobile.Data.Repositories;

public sealed class DeviceRegistrationRepository(LocalDatabase database) : IDeviceRegistrationRepository
{
    public Task<DeviceRegistrationLocal?> GetAsync(CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            async connection =>
            {
                var entities = await connection.Table<DeviceRegistrationEntity>()
                    .Take(1)
                    .ToListAsync()
                    .ConfigureAwait(false);
                var entity = entities.FirstOrDefault();
                return entity is null ? null : EntityMapper.ToLocal(entity);
            },
            cancellationToken);

    public Task UpsertAsync(DeviceRegistrationLocal registration, CancellationToken cancellationToken = default) =>
        database.ExecuteAsync(
            connection => connection.InsertOrReplaceAsync(EntityMapper.FromLocal(registration)),
            cancellationToken);
}
