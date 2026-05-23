using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;
using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Services;

public sealed class LocalSettingsService(ILocalSettingsRepository repository) : ILocalSettingsService
{
    public async Task<string?> GetAsync(string key, CancellationToken cancellationToken = default)
    {
        var entry = await repository.GetAsync(key, cancellationToken).ConfigureAwait(false);
        return entry?.Value;
    }

    public Task SetAsync(string key, string value, CancellationToken cancellationToken = default) =>
        repository.UpsertAsync(
            new LocalSettingEntry
            {
                Key = key,
                Value = value,
                UpdatedAt = DateTime.UtcNow
            },
            cancellationToken);

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default) =>
        repository.DeleteAsync(key, cancellationToken);
}
