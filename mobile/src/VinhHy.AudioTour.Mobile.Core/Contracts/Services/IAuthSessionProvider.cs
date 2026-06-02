using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Services;

/// <summary>
/// In-memory holder for the active session (used by HTTP handlers).
/// </summary>
public interface IAuthSessionProvider
{
    AuthSession? Current { get; }

    void SetSession(AuthSession? session);

    string? GetAccessToken();
}
