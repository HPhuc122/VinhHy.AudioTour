namespace VinhHy.NarrationAPI.Domain.Entities;

public class TourTranslation
{
    public int Id { get; set; }

    public int TourId { get; set; }

    public string LanguageCode { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public Tour Tour { get; set; } = null!;
}
