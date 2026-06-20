namespace VinhHy.NarrationAPI.Infrastructure.Options;

public class TranslationOptions
{
    public const string SectionName = "Translation";

    public string Provider { get; set; } = "Simulated";

    public RealApiTranslationOptions RealApi { get; set; } = new();
}

public class RealApiTranslationOptions
{
    public string? BaseUrl { get; set; }

    public string EndpointPath { get; set; } = "/v1/chat/completions";

    public string? Model { get; set; }

    public string? ApiKey { get; set; }

    public string ApiKeyEnvironmentVariable { get; set; } = "VINHHY_TRANSLATION_API_KEY";

    public int TimeoutSeconds { get; set; } = 30;
}
