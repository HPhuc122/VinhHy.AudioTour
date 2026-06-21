using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Infrastructure.Options;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class GoogleTranslateProvider(
    HttpClient httpClient,
    IOptions<TranslationOptions> options,
    ILogger<GoogleTranslateProvider> logger) : ITranslationProvider
{
    private const string NotConfiguredMessage = "D\u1ecbch v\u1ee5 d\u1ecbch ch\u01b0a \u0111\u01b0\u1ee3c c\u1ea5u h\u00ecnh";
    private const string MissingApiKeyMessage = "Ch\u01b0a c\u1ea5u h\u00ecnh API key cho d\u1ecbch v\u1ee5 d\u1ecbch";
    private const string ApiKeyServiceBlockedMessage = "API key \u0111ang b\u1ecb ch\u1eb7n kh\u1ecfi Cloud Translation API. H\u00e3y cho ph\u00e9p Cloud Translation API trong API restrictions c\u1ee7a key.";
    private const string ProviderUnavailableMessage = "D\u1ecbch v\u1ee5 d\u1ecbch \u0111ang l\u1ed7i ho\u1eb7c kh\u00f4ng ph\u1ea3n h\u1ed3i";
    private const string InvalidResponseMessage = "D\u1ecbch v\u1ee5 d\u1ecbch tr\u1ea3 v\u1ec1 d\u1eef li\u1ec7u kh\u00f4ng h\u1ee3p l\u1ec7";

    private const string TranslateEndpoint = "https://translation.googleapis.com/language/translate/v2";

    public async Task<string> TranslateAsync(
        string sourceText,
        string sourceLanguageCode,
        string targetLanguageCode,
        CancellationToken cancellationToken = default)
    {
        var config = options.Value.GoogleTranslate;
        if (!HasProviderConfiguration(config))
        {
            throw new AppException(NotConfiguredMessage);
        }

        var apiKey = ResolveApiKey(config);
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new AppException(MissingApiKeyMessage);
        }

        var endpoint = $"{TranslateEndpoint}?key={Uri.EscapeDataString(apiKey.Trim())}";
        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = JsonContent.Create(new GoogleTranslateRequest
            {
                Q = [sourceText],
                Source = NormalizeLanguageCode(sourceLanguageCode),
                Target = NormalizeLanguageCode(targetLanguageCode),
                Format = "text"
            })
        };

        HttpResponseMessage response;
        try
        {
            response = await httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "Google Translate request failed before receiving a response.");
            throw new AppException(ProviderUnavailableMessage, ex, statusCode: 502);
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "Google Translate request timed out.");
            throw new AppException(ProviderUnavailableMessage, ex, statusCode: 502);
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                var providerError = await ReadProviderErrorAsync(response, cancellationToken).ConfigureAwait(false);
                logger.LogWarning(
                    "Google Translate provider returned non-success status code {StatusCode}. Reason: {Reason}",
                    (int)response.StatusCode,
                    providerError?.Error?.Details?
                        .FirstOrDefault(detail => !string.IsNullOrWhiteSpace(detail.Reason))
                        ?.Reason);

                if (providerError?.Error?.Details?.Any(detail =>
                        string.Equals(detail.Reason, "API_KEY_SERVICE_BLOCKED", StringComparison.OrdinalIgnoreCase)) == true)
                {
                    throw new AppException(ApiKeyServiceBlockedMessage);
                }

                throw new AppException(ProviderUnavailableMessage, statusCode: 502);
            }

            GoogleTranslateResponse? body;
            try
            {
                body = await response.Content.ReadFromJsonAsync<GoogleTranslateResponse>(cancellationToken)
                    .ConfigureAwait(false);
            }
            catch (JsonException ex)
            {
                logger.LogWarning(ex, "Google Translate provider returned invalid JSON.");
                throw new AppException(InvalidResponseMessage, ex, statusCode: 502);
            }

            var translatedText = body?.Data?.Translations is { Count: > 0 }
                ? body.Data.Translations[0].TranslatedText
                : null;

            translatedText = WebUtility.HtmlDecode(translatedText)?.Trim();
            if (string.IsNullOrWhiteSpace(translatedText))
            {
                throw new AppException(InvalidResponseMessage, statusCode: 502);
            }

            return translatedText;
        }
    }

    public static bool IsConfigured(GoogleTranslateOptions config) =>
        !string.IsNullOrWhiteSpace(ResolveApiKey(config));

    private static bool HasProviderConfiguration(GoogleTranslateOptions config) =>
        !string.IsNullOrWhiteSpace(config.ApiKey)
        || !string.IsNullOrWhiteSpace(config.ApiKeyEnvironmentVariable);

    private static string? ResolveApiKey(GoogleTranslateOptions config)
    {
        if (!string.IsNullOrWhiteSpace(config.ApiKey))
        {
            return config.ApiKey.Trim();
        }

        return string.IsNullOrWhiteSpace(config.ApiKeyEnvironmentVariable)
            ? null
            : Environment.GetEnvironmentVariable(config.ApiKeyEnvironmentVariable.Trim());
    }

    private static string NormalizeLanguageCode(string languageCode) =>
        languageCode.Trim().Split('-')[0].ToLowerInvariant();

    private static async Task<GoogleApiErrorResponse?> ReadProviderErrorAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        try
        {
            return await response.Content.ReadFromJsonAsync<GoogleApiErrorResponse>(cancellationToken)
                .ConfigureAwait(false);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private sealed class GoogleTranslateRequest
    {
        [JsonPropertyName("q")]
        public IReadOnlyList<string> Q { get; set; } = [];

        [JsonPropertyName("source")]
        public string Source { get; set; } = string.Empty;

        [JsonPropertyName("target")]
        public string Target { get; set; } = string.Empty;

        [JsonPropertyName("format")]
        public string Format { get; set; } = "text";
    }

    private sealed class GoogleTranslateResponse
    {
        [JsonPropertyName("data")]
        public GoogleTranslateData? Data { get; set; }
    }

    private sealed class GoogleTranslateData
    {
        [JsonPropertyName("translations")]
        public IReadOnlyList<GoogleTranslateTranslation>? Translations { get; set; }
    }

    private sealed class GoogleTranslateTranslation
    {
        [JsonPropertyName("translatedText")]
        public string? TranslatedText { get; set; }
    }

    private sealed class GoogleApiErrorResponse
    {
        [JsonPropertyName("error")]
        public GoogleApiError? Error { get; set; }
    }

    private sealed class GoogleApiError
    {
        [JsonPropertyName("details")]
        public IReadOnlyList<GoogleApiErrorDetail>? Details { get; set; }
    }

    private sealed class GoogleApiErrorDetail
    {
        [JsonPropertyName("reason")]
        public string? Reason { get; set; }
    }
}
