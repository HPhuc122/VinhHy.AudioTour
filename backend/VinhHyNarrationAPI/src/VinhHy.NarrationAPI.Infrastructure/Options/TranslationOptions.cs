namespace VinhHy.NarrationAPI.Infrastructure.Options;

public class TranslationOptions
{
    public const string SectionName = "Translation";

    public string Provider { get; set; } = "Simulated";

    public GoogleTranslateOptions GoogleTranslate { get; set; } = new();
}

public class GoogleTranslateOptions
{
    public string? ApiKey { get; set; }

    public string ApiKeyEnvironmentVariable { get; set; } = "GOOGLE_TRANSLATE_API_KEY";

    public int TimeoutSeconds { get; set; } = 30;
}
