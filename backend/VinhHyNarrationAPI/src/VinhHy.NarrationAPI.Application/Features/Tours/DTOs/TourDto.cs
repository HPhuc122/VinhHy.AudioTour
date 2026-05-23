namespace VinhHy.NarrationAPI.Application.Features.Tours.DTOs;

public class TourDto
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string DefaultLanguage { get; set; } = "vi";

    public bool IsActive { get; set; }

    public int? EstimatedMinutes { get; set; }

    public int Version { get; set; }

    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public IReadOnlyList<TourTranslationDto> Translations { get; set; } = [];

    public IReadOnlyList<TourPoiDto> Pois { get; set; } = [];
}
