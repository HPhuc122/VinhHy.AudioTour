namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface ITranslationProvider
{
    Task<string> TranslateAsync(
        string sourceText,
        string sourceLanguageCode,
        string targetLanguageCode,
        CancellationToken cancellationToken = default);
}
