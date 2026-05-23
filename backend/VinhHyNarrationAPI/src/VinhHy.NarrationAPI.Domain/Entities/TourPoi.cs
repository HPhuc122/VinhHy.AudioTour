namespace VinhHy.NarrationAPI.Domain.Entities;

public class TourPoi
{
    public int Id { get; set; }

    public int TourId { get; set; }

    public int POIId { get; set; }

    public int OrderIndex { get; set; }

    public Tour Tour { get; set; } = null!;

    public Poi Poi { get; set; } = null!;
}
