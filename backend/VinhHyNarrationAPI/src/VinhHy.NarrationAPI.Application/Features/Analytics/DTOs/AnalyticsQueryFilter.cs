namespace VinhHy.NarrationAPI.Application.Features.Analytics.DTOs;

public class AnalyticsQueryFilter
{
    public DateOnly? From { get; set; }

    public DateOnly? To { get; set; }

    public int? POIId { get; set; }
}
