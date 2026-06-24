namespace VinhHy.NarrationAPI.Application.Features.Analytics.DTOs;

public class AnalyticsGroupedDto
{
    public string Key { get; set; } = string.Empty;

    public string Label { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public int TotalPlays { get; set; }

    public int GpsPlays { get; set; }

    public int QrPlays { get; set; }

    public int ManualPlays { get; set; }

    public int UniqueDevices { get; set; }
}
