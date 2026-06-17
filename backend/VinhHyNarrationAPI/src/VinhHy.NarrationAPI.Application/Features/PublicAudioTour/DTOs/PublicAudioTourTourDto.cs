namespace VinhHy.NarrationAPI.Application.Features.PublicAudioTour.DTOs;

public class PublicAudioTourTourDto
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string DefaultLanguage { get; set; } = "vi";

    public int? EstimatedMinutes { get; set; }

    public IReadOnlyList<PublicAudioTourPoiDto> Pois { get; set; } = [];
}
