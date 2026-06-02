using VinhHy.AudioTour.Mobile.Core.Api.Auth;
using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Services;

public interface IAuthService
{
    AuthSession? CurrentSession { get; }

    bool IsAuthenticated { get; }

    /// <summary>
    /// Loads tokens from SecureStorage, refreshes if expired, and hydrates the in-memory session.
    /// </summary>
    Task<AuthSession?> RestoreSessionAsync(CancellationToken cancellationToken = default);

    Task<AuthSession> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

    Task<bool> TryRefreshSessionAsync(CancellationToken cancellationToken = default);

    Task LogoutAsync(CancellationToken cancellationToken = default);
}
