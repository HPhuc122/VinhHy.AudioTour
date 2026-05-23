namespace VinhHy.NarrationAPI.Application.Features.Tours.DTOs;

public class ReorderTourPoisRequest
{
    public IReadOnlyList<TourPoiOrderItem> Items { get; set; } = [];
}

public class TourPoiOrderItem
{
    public int POIId { get; set; }

    public int OrderIndex { get; set; }
}
