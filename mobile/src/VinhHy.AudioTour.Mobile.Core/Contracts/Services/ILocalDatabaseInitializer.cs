namespace VinhHy.AudioTour.Mobile.Core.Contracts.Services;

public interface ILocalDatabaseInitializer
{
    Task InitializeAsync(CancellationToken cancellationToken = default);
}
