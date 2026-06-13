namespace VinhHy.NarrationAPI.Application.Features.Tours.DTOs;

public class PublicTourPoiDto
{
    public int Id { get; set; }

    public int TourId { get; set; }

    public int POIId { get; set; }

    public string? PoiCode { get; set; }

    public string? PoiName { get; set; }

    public string? PoiDescription { get; set; }

    public string? PoiShortDescription { get; set; }

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public string? ImageUrl { get; set; }

    public string? Category { get; set; }

    public bool HasAudio { get; set; }

    public int OrderIndex { get; set; }
}
