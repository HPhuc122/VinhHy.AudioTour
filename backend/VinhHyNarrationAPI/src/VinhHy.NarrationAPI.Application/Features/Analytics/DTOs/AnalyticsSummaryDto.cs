namespace VinhHy.NarrationAPI.Application.Features.Analytics.DTOs;

public class AnalyticsSummaryDto
{
    public int TotalPlays { get; set; }

    public int GpsPlays { get; set; }

    public int QrPlays { get; set; }

    public int ManualPlays { get; set; }

    public int UniqueDevices { get; set; }

    public DateOnly? From { get; set; }

    public DateOnly? To { get; set; }
}
