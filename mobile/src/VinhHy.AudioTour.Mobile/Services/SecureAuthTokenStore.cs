using System.Text.Json;
using VinhHy.AudioTour.Mobile.Core.Constants;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;
using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Services;

public sealed class SecureAuthTokenStore : IAuthTokenStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public async Task<StoredAuthSession?> LoadAsync(CancellationToken cancellationToken = default)
    {
        var json = await SecureStorage.Default.GetAsync(AuthStorageKeys.SessionJson)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        return JsonSerializer.Deserialize<StoredAuthSession>(json, JsonOptions);
    }

    public async Task SaveAsync(StoredAuthSession session, CancellationToken cancellationToken = default)
    {
        var json = JsonSerializer.Serialize(session, JsonOptions);
        await SecureStorage.Default.SetAsync(AuthStorageKeys.SessionJson, json).ConfigureAwait(false);
    }

    public Task ClearAsync(CancellationToken cancellationToken = default) =>
        SecureStorage.Default.SetAsync(AuthStorageKeys.SessionJson, null);
}
