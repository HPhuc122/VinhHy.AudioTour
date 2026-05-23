using VinhHy.AudioTour.Mobile.Core.Contracts.Services;

namespace VinhHy.AudioTour.Mobile.Data.Database;

public sealed class LocalDatabaseInitializer(LocalDatabase database) : ILocalDatabaseInitializer
{
    public Task InitializeAsync(CancellationToken cancellationToken = default) =>
        database.InitializeAsync(cancellationToken);
}
