namespace VinhHy.NarrationAPI.Application.Features.Tours.DTOs;

public class TourPoiDto
{
    public int Id { get; set; }

    public int TourId { get; set; }

    public int POIId { get; set; }

    public string? PoiCode { get; set; }

    public int OrderIndex { get; set; }
}
