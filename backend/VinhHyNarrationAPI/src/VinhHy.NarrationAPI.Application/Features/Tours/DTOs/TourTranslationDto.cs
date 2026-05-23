namespace VinhHy.NarrationAPI.Application.Features.Tours.DTOs;

public class TourTranslationDto
{
    public int Id { get; set; }

    public int TourId { get; set; }

    public string LanguageCode { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }
}
