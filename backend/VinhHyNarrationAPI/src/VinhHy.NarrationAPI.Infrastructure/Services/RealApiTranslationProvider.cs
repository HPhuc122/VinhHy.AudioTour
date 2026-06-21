using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Infrastructure.Options;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class RealApiTranslationProvider(
    HttpClient httpClient,
    IOptions<TranslationOptions> options,
    ILogger<RealApiTranslationProvider> logger) : ITranslationProvider
{
    private const string NotConfiguredMessage = "D\u1ecbch v\u1ee5 d\u1ecbch ch\u01b0a \u0111\u01b0\u1ee3c c\u1ea5u h\u00ecnh";
    private const string MissingApiKeyMessage = "Ch\u01b0a c\u1ea5u h\u00ecnh API key cho d\u1ecbch v\u1ee5 d\u1ecbch";
    private const string ProviderUnavailableMessage = "D\u1ecbch v\u1ee5 d\u1ecbch \u0111ang l\u1ed7i ho\u1eb7c kh\u00f4ng ph\u1ea3n h\u1ed3i";
    private const string InvalidResponseMessage = "D\u1ecbch v\u1ee5 d\u1ecbch tr\u1ea3 v\u1ec1 d\u1eef li\u1ec7u kh\u00f4ng h\u1ee3p l\u1ec7";

    public async Task<string> TranslateAsync(
        string sourceText,
        string sourceLanguageCode,
        string targetLanguageCode,
        CancellationToken cancellationToken = default)
    {
        var config = options.Value.RealApi;
        var apiKey = ResolveApiKey(config);
        var endpoint = ResolveEndpoint(config);

        if (!HasRequiredConfiguration(options.Value, config, endpoint))
        {
            throw new AppException(NotConfiguredMessage);
        }

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new AppException(MissingApiKeyMessage);
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = JsonContent.Create(new RealApiChatRequest
            {
                Model = config.Model!.Trim(),
                Messages =
                [
                    new RealApiChatMessage
                    {
                        Role = "system",
                        Content = "You are a professional translation engine. Translate from the source language to the target language. Return only the translated text. Preserve meaning, numbers, names, punctuation, and simple formatting. Do not add explanations."
                    },
                    new RealApiChatMessage
                    {
                        Role = "user",
                        Content = $"Source language: {sourceLanguageCode}\nTarget language: {targetLanguageCode}\nText:\n{sourceText}"
                    }
                ],
                Temperature = 0.1m
            })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        HttpResponseMessage response;
        try
        {
            response = await httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "RealApi translation request failed before receiving a response.");
            throw new AppException(ProviderUnavailableMessage, ex, statusCode: 502);
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "RealApi translation request timed out.");
            throw new AppException(ProviderUnavailableMessage, ex, statusCode: 502);
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "RealApi translation provider returned non-success status code {StatusCode}.",
                    (int)response.StatusCode);
                throw new AppException(ProviderUnavailableMessage, statusCode: 502);
            }

            RealApiChatResponse? body;
            try
            {
                body = await response.Content.ReadFromJsonAsync<RealApiChatResponse>(cancellationToken)
                    .ConfigureAwait(false);
            }
            catch (JsonException ex)
            {
                logger.LogWarning(ex, "RealApi translation provider returned invalid JSON.");
                throw new AppException(InvalidResponseMessage, ex, statusCode: 502);
            }

            var translatedText = body?.Choices is { Count: > 0 }
                ? body.Choices[0].Message?.Content?.Trim()
                : null;

            if (string.IsNullOrWhiteSpace(translatedText))
            {
                throw new AppException(InvalidResponseMessage, statusCode: 502);
            }

            return translatedText;
        }
    }

    public static bool IsConfigured(RealApiTranslationOptions config) =>
        IsConfigured(config, ResolveApiKey(config), ResolveEndpoint(config));

    private static bool IsConfigured(RealApiTranslationOptions config, string? apiKey, Uri? endpoint) =>
        !string.IsNullOrWhiteSpace(apiKey)
        && HasRequiredRealApiConfiguration(config, endpoint);

    private static bool HasRequiredConfiguration(
        TranslationOptions options,
        RealApiTranslationOptions config,
        Uri? endpoint) =>
        string.Equals(options.Provider, TranslationProviderNames.RealApi, StringComparison.OrdinalIgnoreCase)
        && HasRequiredRealApiConfiguration(config, endpoint);

    private static bool HasRequiredRealApiConfiguration(RealApiTranslationOptions config, Uri? endpoint) =>
        !string.IsNullOrWhiteSpace(config.BaseUrl)
        && !string.IsNullOrWhiteSpace(config.EndpointPath)
        && endpoint is not null
        && !string.IsNullOrWhiteSpace(config.Model);

    private static string? ResolveApiKey(RealApiTranslationOptions config)
    {
        if (!string.IsNullOrWhiteSpace(config.ApiKey))
        {
            return config.ApiKey.Trim();
        }

        return string.IsNullOrWhiteSpace(config.ApiKeyEnvironmentVariable)
            ? null
            : Environment.GetEnvironmentVariable(config.ApiKeyEnvironmentVariable.Trim());
    }

    private static Uri? ResolveEndpoint(RealApiTranslationOptions config)
    {
        if (string.IsNullOrWhiteSpace(config.BaseUrl) || string.IsNullOrWhiteSpace(config.EndpointPath))
        {
            return null;
        }

        var baseUrl = config.BaseUrl.Trim().TrimEnd('/');
        var endpointPath = config.EndpointPath.Trim();
        var endpoint = $"{baseUrl}/{endpointPath.TrimStart('/')}";

        return Uri.TryCreate(endpoint, UriKind.Absolute, out var uri) ? uri : null;
    }

    private sealed class RealApiChatRequest
    {
        public string Model { get; set; } = string.Empty;

        public IReadOnlyList<RealApiChatMessage> Messages { get; set; } = [];

        public decimal Temperature { get; set; }
    }

    private sealed class RealApiChatMessage
    {
        public string Role { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;
    }

    private sealed class RealApiChatResponse
    {
        public IReadOnlyList<RealApiChatChoice>? Choices { get; set; }
    }

    private sealed class RealApiChatChoice
    {
        public RealApiChatMessage? Message { get; set; }
    }
}
