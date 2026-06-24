namespace VinhHy.NarrationAPI.Application.Features.Analytics.DTOs;

public class AnalyticsQueryFilter
{
    public DateOnly? From { get; set; }

    public DateOnly? To { get; set; }

    public int? POIId { get; set; }

    public string? PoiCode { get; set; }

    public AnalyticsGroupBy GroupBy { get; set; } = AnalyticsGroupBy.DayOfMonth;
}

public enum AnalyticsGroupBy
{
    Hour = 0,
    DayOfWeek = 1,
    DayOfMonth = 2,
    MonthOfYear = 3,
    WeekOfMonth = 4
}
