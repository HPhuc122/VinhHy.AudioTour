using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Services;

/// <summary>
/// Persists authentication tokens using platform secure storage.
/// </summary>
public interface IAuthTokenStore
{
    Task<StoredAuthSession?> LoadAsync(CancellationToken cancellationToken = default);

    Task SaveAsync(StoredAuthSession session, CancellationToken cancellationToken = default);

    Task ClearAsync(CancellationToken cancellationToken = default);
}
