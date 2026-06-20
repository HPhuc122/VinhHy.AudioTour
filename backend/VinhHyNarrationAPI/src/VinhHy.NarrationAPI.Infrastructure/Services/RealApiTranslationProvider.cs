using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Infrastructure.Options;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class RealApiTranslationProvider(HttpClient httpClient, IOptions<TranslationOptions> options) : ITranslationProvider
{
    private const string NotConfiguredMessage = "Dịch vụ dịch chưa được cấu hình";
    private const string ProviderUnavailableMessage = "Dịch vụ dịch tự động tạm thời không khả dụng. Vui lòng thử lại sau.";

    public async Task<string> TranslateAsync(
        string sourceText,
        string sourceLanguageCode,
        string targetLanguageCode,
        CancellationToken cancellationToken = default)
    {
        var config = options.Value.RealApi;
        var apiKey = ResolveApiKey(config);
        var endpoint = ResolveEndpoint(config);

        if (!IsConfigured(config, apiKey, endpoint))
        {
            throw new AppException(NotConfiguredMessage);
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

        using var response = await httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            throw new AppException(ProviderUnavailableMessage, statusCode: 502);
        }

        var body = await response.Content.ReadFromJsonAsync<RealApiChatResponse>(cancellationToken)
            .ConfigureAwait(false);
        var translatedText = body?.Choices?
            .Select(choice => choice.Message?.Content?.Trim())
            .FirstOrDefault(text => !string.IsNullOrWhiteSpace(text));

        if (string.IsNullOrWhiteSpace(translatedText))
        {
            throw new AppException(ProviderUnavailableMessage, statusCode: 502);
        }

        return translatedText;
    }

    public static bool IsConfigured(RealApiTranslationOptions config) =>
        IsConfigured(config, ResolveApiKey(config), ResolveEndpoint(config));

    private static bool IsConfigured(RealApiTranslationOptions config, string? apiKey, Uri? endpoint) =>
        !string.IsNullOrWhiteSpace(apiKey)
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
        if (string.IsNullOrWhiteSpace(config.BaseUrl))
        {
            return null;
        }

        var baseUrl = config.BaseUrl.Trim().TrimEnd('/');
        var endpointPath = string.IsNullOrWhiteSpace(config.EndpointPath)
            ? "/v1/chat/completions"
            : config.EndpointPath.Trim();
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
