using System.Net;
using System.Net.Http.Headers;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;

namespace VinhHy.AudioTour.Mobile.Http;

/// <summary>
/// Attaches the bearer access token and retries once after refresh on 401 Unauthorized.
/// </summary>
public sealed class AuthenticatedHttpMessageHandler : DelegatingHandler
{
    private readonly IAuthSessionProvider _sessionProvider;
    private readonly IAuthService _authService;

    public AuthenticatedHttpMessageHandler(
        IAuthSessionProvider sessionProvider,
        IAuthService authService)
    {
        _sessionProvider = sessionProvider;
        _authService = authService;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        if (!IsAuthEndpoint(request))
        {
            ApplyBearerToken(request);
        }

        var response = await base.SendAsync(request, cancellationToken).ConfigureAwait(false);

        if (response.StatusCode != HttpStatusCode.Unauthorized || IsAuthEndpoint(request))
        {
            return response;
        }

        response.Dispose();

        if (!await _authService.TryRefreshSessionAsync(cancellationToken).ConfigureAwait(false))
        {
            return new HttpResponseMessage(HttpStatusCode.Unauthorized)
            {
                RequestMessage = request
            };
        }

        using var retryRequest = await CloneRequestAsync(request, cancellationToken).ConfigureAwait(false);
        ApplyBearerToken(retryRequest);

        return await base.SendAsync(retryRequest, cancellationToken).ConfigureAwait(false);
    }

    private void ApplyBearerToken(HttpRequestMessage request)
    {
        var token = _sessionProvider.GetAccessToken();
        if (string.IsNullOrWhiteSpace(token))
        {
            request.Headers.Authorization = null;
            return;
        }

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    private static bool IsAuthEndpoint(HttpRequestMessage request)
    {
        var path = request.RequestUri?.AbsolutePath ?? string.Empty;
        return path.Contains("/auth/", StringComparison.OrdinalIgnoreCase);
    }

    private static async Task<HttpRequestMessage> CloneRequestAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var clone = new HttpRequestMessage(request.Method, request.RequestUri);

        foreach (var header in request.Headers)
        {
            if (header.Key.Equals("Authorization", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            clone.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }

        if (request.Content is not null)
        {
            var bytes = await request.Content.ReadAsByteArrayAsync(cancellationToken).ConfigureAwait(false);
            clone.Content = new ByteArrayContent(bytes);

            foreach (var header in request.Content.Headers)
            {
                clone.Content.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }
        }

        return clone;
    }
}
