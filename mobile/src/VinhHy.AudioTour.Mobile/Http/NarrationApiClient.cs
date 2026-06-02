using System.Net.Http.Json;
using System.Text.Json;
using Polly;
using Polly.Retry;
using VinhHy.AudioTour.Mobile.Core.Api;
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
    private readonly AsyncRetryPolicy<HttpResponseMessage> _retryPolicy;

    public NarrationApiClient(HttpClient httpClient)
    {
        _httpClient = httpClient;

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
