using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;

public interface ILocalSettingsRepository
{
    Task<LocalSettingEntry?> GetAsync(string key, CancellationToken cancellationToken = default);

    Task SetAsync(LocalSettingEntry entry, CancellationToken cancellationToken = default);

    Task DeleteAsync(string key, CancellationToken cancellationToken = default);
}
