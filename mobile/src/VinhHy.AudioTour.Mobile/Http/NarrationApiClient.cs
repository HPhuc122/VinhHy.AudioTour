using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Polly;
using Polly.Retry;
using VinhHy.AudioTour.Mobile.Configuration;
using VinhHy.AudioTour.Mobile.Core.Api;
using VinhHy.AudioTour.Mobile.Core.Constants;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;

namespace VinhHy.AudioTour.Mobile.Http;

public sealed class NarrationApiClient : IApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly HttpClient _httpClient;
    private readonly ILocalSettingsService _settings;
    private readonly AsyncRetryPolicy<HttpResponseMessage> _retryPolicy;

    public NarrationApiClient(
        HttpClient httpClient,
        IOptions<ApiOptions> options,
        ILocalSettingsService settings)
    {
        _httpClient = httpClient;
        _settings = settings;

        var api = options.Value;
        _httpClient.BaseAddress = new Uri(api.BaseUrl.TrimEnd('/') + "/");
        _httpClient.Timeout = TimeSpan.FromSeconds(api.TimeoutSeconds);

        _retryPolicy = Policy<HttpResponseMessage>
            .Handle<HttpRequestException>()
            .OrResult(r => (int)r.StatusCode >= 500)
            .WaitAndRetryAsync(3, attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)));
    }

    public Task<ApiResponse<T>> GetAsync<T>(string path, CancellationToken cancellationToken = default) =>
        SendAsync<T>(HttpMethod.Get, path, null, cancellationToken);

    public Task<ApiResponse<T>> PostAsync<T>(
        string path,
        object? body,
        CancellationToken cancellationToken = default) =>
        SendAsync<T>(HttpMethod.Post, path, body, cancellationToken);

    public Task<ApiResponse<T>> PutAsync<T>(
        string path,
        object? body,
        CancellationToken cancellationToken = default) =>
        SendAsync<T>(HttpMethod.Put, path, body, cancellationToken);

    public Task<ApiResponse<T>> DeleteAsync<T>(string path, CancellationToken cancellationToken = default) =>
        SendAsync<T>(HttpMethod.Delete, path, null, cancellationToken);

    private async Task<ApiResponse<T>> SendAsync<T>(
        HttpMethod method,
        string path,
        object? body,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(method, path.TrimStart('/'));

        var token = await _settings.GetAsync(SettingKeys.AccessToken, cancellationToken).ConfigureAwait(false);
        if (!string.IsNullOrWhiteSpace(token))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        if (body is not null)
        {
            request.Content = JsonContent.Create(body, options: JsonOptions);
        }

        var response = await _retryPolicy
            .ExecuteAsync(ct => _httpClient.SendAsync(request, ct), cancellationToken)
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

        var envelope = JsonSerializer.Deserialize<ApiResponse<T>>(payload, JsonOptions);
        if (envelope is not null)
        {
            return envelope;
        }

        return new ApiResponse<T>
        {
            Success = false,
            Message = "Invalid API response format"
        };
    }
}
