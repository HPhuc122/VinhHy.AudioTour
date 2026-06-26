using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Infrastructure.Options;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

// ─────────────────────────────────────────────────────────────────────────────
// Voice map: languageCode → Google TTS REST API voice name (WaveNet)
// ─────────────────────────────────────────────────────────────────────────────
public static class TtsVoiceMap
{
    public record VoiceConfig(string BcpCode, string VoiceName, string Gender);

    private static readonly Dictionary<string, VoiceConfig> Map = new(StringComparer.OrdinalIgnoreCase)
    {
        ["vi"] = new("vi-VN", "vi-VN-Wavenet-A", "FEMALE"),
        ["en"] = new("en-US", "en-US-Wavenet-D", "MALE"),
        ["zh"] = new("cmn-CN", "cmn-CN-Wavenet-A", "FEMALE"),
        ["ko"] = new("ko-KR", "ko-KR-Wavenet-A", "FEMALE"),
        ["ja"] = new("ja-JP", "ja-JP-Wavenet-A", "FEMALE"),
        ["fr"] = new("fr-FR", "fr-FR-Wavenet-A", "FEMALE"),
    };

    public static VoiceConfig Get(string langCode)
        => Map.TryGetValue(langCode.Split('-')[0], out var v) ? v
           : throw new AppException($"No TTS voice configured for language: {langCode}");

    public static IEnumerable<string> SupportedLanguages => Map.Keys;
}

// ─────────────────────────────────────────────────────────────────────────────
// Google TTS via REST API (dùng cùng ApiKey với Translation – không cần thêm SDK)
// ─────────────────────────────────────────────────────────────────────────────
public interface IGoogleTtsService
{
    /// <summary>Sinh audio MP3 từ text, trả về byte[]</summary>
    Task<byte[]> SynthesizeAsync(string text, string languageCode, CancellationToken ct = default);
}

public class GoogleTtsService(
    HttpClient httpClient,
    IOptions<TranslationOptions> options,
    ILogger<GoogleTtsService> logger) : IGoogleTtsService
{
    private const string TtsEndpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";

    public async Task<byte[]> SynthesizeAsync(string text, string languageCode, CancellationToken ct = default)
    {
        var apiKey = ResolveApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new AppException("Google TTS API key chưa được cấu hình.");

        var voice = TtsVoiceMap.Get(languageCode);
        var url = $"{TtsEndpoint}?key={Uri.EscapeDataString(apiKey)}";

        var requestBody = new TtsSynthesizeRequest
        {
            Input = new TtsSynthesisInput { Text = text },
            Voice = new TtsVoiceSelectionParams
            {
                LanguageCode = voice.BcpCode,
                Name = voice.VoiceName,
                SsmlGender = voice.Gender,
            },
            AudioConfig = new TtsAudioConfig
            {
                AudioEncoding = "MP3",
                SpeakingRate = 0.95,
                Pitch = 0.0,
            }
        };

        logger.LogInformation("TTS synthesize: lang={Lang} voice={Voice} chars={Chars}",
            voice.BcpCode, voice.VoiceName, text.Length);

        HttpResponseMessage response;
        try
        {
            response = await httpClient
                .PostAsJsonAsync(url, requestBody, ct)
                .ConfigureAwait(false);
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "Google TTS request failed.");
            throw new AppException("Dịch vụ TTS không phản hồi.", ex, statusCode: 502);
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
                logger.LogWarning("Google TTS error {Status}: {Body}", (int)response.StatusCode, errorBody);
                throw new AppException("Dịch vụ TTS trả về lỗi.", statusCode: 502);
            }

            var result = await response.Content
                .ReadFromJsonAsync<TtsSynthesizeResponse>(cancellationToken: ct)
                .ConfigureAwait(false);

            if (string.IsNullOrWhiteSpace(result?.AudioContent))
                throw new AppException("TTS không trả về audio content.", statusCode: 502);

            return Convert.FromBase64String(result.AudioContent);
        }
    }

    private string? ResolveApiKey()
    {
        var cfg = options.Value.GoogleTranslate; // Tái dùng cùng API key section
        if (!string.IsNullOrWhiteSpace(cfg.ApiKey))
            return cfg.ApiKey.Trim();
        return string.IsNullOrWhiteSpace(cfg.ApiKeyEnvironmentVariable)
            ? null
            : Environment.GetEnvironmentVariable(cfg.ApiKeyEnvironmentVariable.Trim());
    }

    // ── Request / Response models ───────────────────────────────────────────

    private sealed class TtsSynthesizeRequest
    {
        [JsonPropertyName("input")]
        public TtsSynthesisInput Input { get; set; } = new();

        [JsonPropertyName("voice")]
        public TtsVoiceSelectionParams Voice { get; set; } = new();

        [JsonPropertyName("audioConfig")]
        public TtsAudioConfig AudioConfig { get; set; } = new();
    }

    private sealed class TtsSynthesisInput
    {
        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;
    }

    private sealed class TtsVoiceSelectionParams
    {
        [JsonPropertyName("languageCode")]
        public string LanguageCode { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("ssmlGender")]
        public string SsmlGender { get; set; } = "NEUTRAL";
    }

    private sealed class TtsAudioConfig
    {
        [JsonPropertyName("audioEncoding")]
        public string AudioEncoding { get; set; } = "MP3";

        [JsonPropertyName("speakingRate")]
        public double SpeakingRate { get; set; } = 1.0;

        [JsonPropertyName("pitch")]
        public double Pitch { get; set; } = 0.0;
    }

    private sealed class TtsSynthesizeResponse
    {
        [JsonPropertyName("audioContent")]
        public string? AudioContent { get; set; }
    }
}
