using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class GoogleTranslatorService : ITranslationService
{
    private const int MaxChunkLength = 450;

    private readonly HttpClient _httpClient;
    private readonly ILogger<GoogleTranslatorService> _logger;

    public GoogleTranslatorService(HttpClient httpClient, ILogger<GoogleTranslatorService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<string> TranslateAsync(
        string text,
        string toLang,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new ValidationException(nameof(text), "Text is required.");
        }

        if (string.IsNullOrWhiteSpace(toLang))
        {
            throw new ValidationException(nameof(toLang), "Target language is required.");
        }

        try
        {
            var targetLanguage = NormalizeTargetLanguage(toLang);

            if (text.Contains('\n') || text.Contains('\r'))
            {
                return await TranslateMultilineAsync(text, targetLanguage, cancellationToken).ConfigureAwait(false);
            }

            return await TranslateTextInChunksAsync(text, targetLanguage, cancellationToken).ConfigureAwait(false);
        }
        catch (AppException)
        {
            throw;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Google Translate returned an invalid JSON response.");
            throw new AppException("Google Translate returned an invalid response.", ex, (int)HttpStatusCode.BadGateway);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google Translate request failed.");
            throw new AppException("Google Translate service is unavailable.", ex, (int)HttpStatusCode.BadGateway);
        }
    }

    private async Task<string> TranslateMultilineAsync(
        string text,
        string toLang,
        CancellationToken cancellationToken)
    {
        var normalizedLines = text.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n');
        var builder = new StringBuilder();

        for (var index = 0; index < normalizedLines.Length; index++)
        {
            if (index > 0)
            {
                builder.Append('\n');
            }

            var line = normalizedLines[index];
            if (string.IsNullOrWhiteSpace(line))
            {
                builder.Append(line.TrimEnd('\r'));
                continue;
            }

            var translatedLine = await TranslateTextInChunksAsync(line, toLang, cancellationToken)
                .ConfigureAwait(false);
            builder.Append(translatedLine);
        }

        return builder.ToString();
    }

    private async Task<string> TranslateTextInChunksAsync(
        string text,
        string toLang,
        CancellationToken cancellationToken)
    {
        var chunks = SplitIntoTranslationChunks(text, forceSentenceChunks: toLang == "en");
        if (chunks.Count == 1)
        {
            return await TranslateSingleTextAsync(chunks[0], toLang, cancellationToken).ConfigureAwait(false);
        }

        var builder = new StringBuilder();
        foreach (var chunk in chunks)
        {
            var translatedChunk = await TranslateSingleTextAsync(chunk, toLang, cancellationToken)
                .ConfigureAwait(false);

            AppendTranslatedChunk(builder, translatedChunk);
        }

        return builder.ToString();
    }

    private async Task<string> TranslateSingleTextAsync(
        string text,
        string toLang,
        CancellationToken cancellationToken)
    {
        var requestUri = $"/translate_a/single?client=gtx&sl=vi&tl={Uri.EscapeDataString(toLang)}&dt=t&q={Uri.EscapeDataString(text)}";
        using var response = await _httpClient.GetAsync(requestUri, cancellationToken).ConfigureAwait(false);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "Google Translate failed with status {StatusCode}: {ResponseBody}",
                response.StatusCode,
                responseBody);

            throw new AppException("Google Translate service failed.", (int)HttpStatusCode.BadGateway);
        }

        return ExtractTranslatedText(responseBody);
    }

    private static string NormalizeTargetLanguage(string toLang)
    {
        var normalized = toLang.Trim().Replace('_', '-').ToLowerInvariant();
        return normalized.StartsWith("en-", StringComparison.Ordinal) ? "en" : normalized;
    }

    private static IReadOnlyList<string> SplitIntoTranslationChunks(string text, bool forceSentenceChunks)
    {
        if (!forceSentenceChunks && text.Length <= MaxChunkLength)
        {
            return [text];
        }

        var chunks = new List<string>();
        var current = new StringBuilder();

        foreach (var character in text)
        {
            current.Append(character);

            if (IsSentenceBoundary(character) || current.Length >= MaxChunkLength)
            {
                AddChunk(chunks, current);
            }
        }

        AddChunk(chunks, current);

        return chunks.Count == 0 ? [text] : chunks;
    }

    private static void AddChunk(ICollection<string> chunks, StringBuilder current)
    {
        var chunk = current.ToString().Trim();
        if (chunk.Length > 0)
        {
            chunks.Add(chunk);
        }

        current.Clear();
    }

    private static bool IsSentenceBoundary(char character) =>
        character is '.' or '!' or '?' or ';' or ':' or '。' or '！' or '？';

    private static void AppendTranslatedChunk(StringBuilder builder, string translatedChunk)
    {
        if (builder.Length > 0
            && !char.IsWhiteSpace(builder[^1])
            && translatedChunk.Length > 0
            && !char.IsPunctuation(translatedChunk[0]))
        {
            builder.Append(' ');
        }

        builder.Append(translatedChunk.Trim());
    }

    private static string ExtractTranslatedText(string responseBody)
    {
        using var document = JsonDocument.Parse(responseBody);
        var root = document.RootElement;

        if (root.ValueKind != JsonValueKind.Array
            || root.GetArrayLength() == 0
            || root[0].ValueKind != JsonValueKind.Array)
        {
            throw new AppException("Google Translate returned an invalid response.", (int)HttpStatusCode.BadGateway);
        }

        var builder = new StringBuilder();

        foreach (var segment in root[0].EnumerateArray())
        {
            if (segment.ValueKind != JsonValueKind.Array || segment.GetArrayLength() == 0)
            {
                continue;
            }

            var translatedSegment = segment[0];
            if (translatedSegment.ValueKind == JsonValueKind.String)
            {
                builder.Append(translatedSegment.GetString());
            }
        }

        var translatedText = builder.ToString();
        if (string.IsNullOrWhiteSpace(translatedText))
        {
            throw new AppException("Google Translate returned an empty response.", (int)HttpStatusCode.BadGateway);
        }

        return translatedText;
    }
}
