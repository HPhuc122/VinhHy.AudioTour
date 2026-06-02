using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
using VinhHy.AudioTour.Mobile.Configuration;
using VinhHy.AudioTour.Mobile.Core.Api;
using VinhHy.AudioTour.Mobile.Core.Api.Auth;
using VinhHy.AudioTour.Mobile.Core.Constants;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;
using VinhHy.AudioTour.Mobile.Core.Exceptions;
using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Services;

public sealed class AuthService : IAuthService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IAuthTokenStore _tokenStore;
    private readonly IAuthSessionProvider _sessionProvider;
    private readonly ILocalSettingsService _settings;
    private readonly SemaphoreSlim _refreshLock = new(1, 1);

    public AuthService(
        IHttpClientFactory httpClientFactory,
        IAuthTokenStore tokenStore,
        IAuthSessionProvider sessionProvider,
        ILocalSettingsService settings)
    {
        _httpClientFactory = httpClientFactory;
        _tokenStore = tokenStore;
        _sessionProvider = sessionProvider;
        _settings = settings;
    }

    public AuthSession? CurrentSession => _sessionProvider.Current;

    public bool IsAuthenticated =>
        _sessionProvider.Current is { } session && !session.IsAccessTokenExpired();

    public async Task<AuthSession?> RestoreSessionAsync(CancellationToken cancellationToken = default)
    {
        var stored = await _tokenStore.LoadAsync(cancellationToken).ConfigureAwait(false);
        if (stored is null)
        {
            _sessionProvider.SetSession(null);
            return null;
        }

        var session = stored.ToSession();

        if (session.IsAccessTokenExpired())
        {
            _sessionProvider.SetSession(session);

            var refreshed = await TryRefreshSessionAsync(cancellationToken).ConfigureAwait(false);
            if (!refreshed)
            {
                await ClearSessionAsync(cancellationToken).ConfigureAwait(false);
                return null;
            }

            return _sessionProvider.Current;
        }

        await ApplySessionAsync(session, persist: false, cancellationToken).ConfigureAwait(false);
        return session;
    }

    public async Task<AuthSession> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var response = await PostAuthAsync<LoginResponse>(
                "api/v1/auth/login",
                request,
                cancellationToken)
            .ConfigureAwait(false);

        if (!response.Success || response.Data is null)
        {
            throw new AuthException(response.Message ?? "Login failed.");
        }

        var session = MapToSession(response.Data);
        await ApplySessionAsync(session, persist: true, cancellationToken).ConfigureAwait(false);
        return session;
    }

    public async Task<bool> TryRefreshSessionAsync(CancellationToken cancellationToken = default)
    {
        await _refreshLock.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            var current = _sessionProvider.Current;
            var refreshToken = current?.RefreshToken;

            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                var stored = await _tokenStore.LoadAsync(cancellationToken).ConfigureAwait(false);
                refreshToken = stored?.RefreshToken;
            }

            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return false;
            }

            if (current is not null && !current.IsAccessTokenExpired())
            {
                return true;
            }

            var response = await PostAuthAsync<LoginResponse>(
                    "api/v1/auth/refresh",
                    new RefreshTokenRequest { RefreshToken = refreshToken },
                    cancellationToken)
                .ConfigureAwait(false);

            if (!response.Success || response.Data is null)
            {
                return false;
            }

            var session = MapToSession(response.Data);
            await ApplySessionAsync(session, persist: true, cancellationToken).ConfigureAwait(false);
            return true;
        }
        finally
        {
            _refreshLock.Release();
        }
    }

    public async Task LogoutAsync(CancellationToken cancellationToken = default)
    {
        await ClearSessionAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task ApplySessionAsync(
        AuthSession session,
        bool persist,
        CancellationToken cancellationToken)
    {
        _sessionProvider.SetSession(session);

        if (persist)
        {
            await _tokenStore.SaveAsync(StoredAuthSession.FromSession(session), cancellationToken)
                .ConfigureAwait(false);
        }

        await _settings
            .SetAsync(SettingKeys.PreferredLanguage, session.PreferredLanguage, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task ClearSessionAsync(CancellationToken cancellationToken)
    {
        _sessionProvider.SetSession(null);
        await _tokenStore.ClearAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task<ApiResponse<T>> PostAuthAsync<T>(
        string path,
        object body,
        CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient(HttpClientNames.Auth);
        using var response = await client
            .PostAsJsonAsync(path.TrimStart('/'), body, JsonOptions, cancellationToken)
            .ConfigureAwait(false);

        var payload = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(payload))
        {
            return new ApiResponse<T>
            {
                Success = response.IsSuccessStatusCode,
                Message = response.ReasonPhrase ?? "Empty response"
            };
        }

        return JsonSerializer.Deserialize<ApiResponse<T>>(payload, JsonOptions)
               ?? new ApiResponse<T> { Success = false, Message = "Invalid API response format" };
    }

    private static AuthSession MapToSession(LoginResponse dto) =>
        new()
        {
            AccessToken = dto.AccessToken,
            RefreshToken = dto.RefreshToken,
            ExpiresAtUtc = dto.ExpiresAtUtc,
            UserId = dto.UserId,
            Username = dto.Username,
            Role = dto.Role,
            PreferredLanguage = dto.PreferredLanguage
        };
}
