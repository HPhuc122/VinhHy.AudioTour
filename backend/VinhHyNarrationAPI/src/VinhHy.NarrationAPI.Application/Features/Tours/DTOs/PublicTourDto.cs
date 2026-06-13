namespace VinhHy.NarrationAPI.Application.Features.Tours.DTOs;

public class PublicTourDto
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string DefaultLanguage { get; set; } = "vi";

    public int? EstimatedMinutes { get; set; }

    public IReadOnlyList<TourTranslationDto> Translations { get; set; } = [];

    public IReadOnlyList<PublicTourPoiDto> Pois { get; set; } = [];
}
