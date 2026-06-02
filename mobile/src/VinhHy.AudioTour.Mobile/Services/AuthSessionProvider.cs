using VinhHy.AudioTour.Mobile.Core.Contracts.Services;
using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Services;

public sealed class AuthSessionProvider : IAuthSessionProvider
{
    private readonly object _lock = new();
    private AuthSession? _current;

    public AuthSession? Current
    {
        get
        {
            lock (_lock)
            {
                return _current;
            }
        }
    }

    public void SetSession(AuthSession? session)
    {
        lock (_lock)
        {
            _current = session;
        }
    }

    public string? GetAccessToken()
    {
        lock (_lock)
        {
            return string.IsNullOrWhiteSpace(_current?.AccessToken) ? null : _current.AccessToken;
        }
    }
}
