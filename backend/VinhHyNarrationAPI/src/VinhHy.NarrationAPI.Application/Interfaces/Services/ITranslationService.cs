namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface ITranslationService
{
    Task<string> TranslateAsync(string text, string toLang, CancellationToken cancellationToken = default);
}
