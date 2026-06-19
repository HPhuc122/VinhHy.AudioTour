namespace VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

public class TranslateTextRequest
{
    public string Text { get; set; } = string.Empty;

    public string TargetLanguage { get; set; } = string.Empty;
}
