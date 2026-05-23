namespace VinhHy.NarrationAPI.Application.Features.Tours.DTOs;

public class CreateTourTranslationRequest
{
    public string LanguageCode { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }
}
