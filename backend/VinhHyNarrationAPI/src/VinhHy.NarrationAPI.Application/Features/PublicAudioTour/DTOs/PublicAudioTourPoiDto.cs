namespace VinhHy.NarrationAPI.Application.Features.PublicAudioTour.DTOs;

public class PublicAudioTourPoiDto
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? ShortDescription { get; set; }

    public string? NarrationText { get; set; }

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public string? ImageUrl { get; set; }

    public string? Category { get; set; }

    public int OrderIndex { get; set; }

    public IReadOnlyList<PublicAudioTourAudioDto> AudioTracks { get; set; } = [];
}
