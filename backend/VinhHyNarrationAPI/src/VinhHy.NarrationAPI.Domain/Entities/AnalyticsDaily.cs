namespace VinhHy.NarrationAPI.Domain.Entities;

public class AnalyticsDaily
{
    public int Id { get; set; }

    public int POIId { get; set; }

    public DateOnly Date { get; set; }

    public int TotalPlays { get; set; }

    public int GpsPlays { get; set; }

    public int QrPlays { get; set; }

    public int ManualPlays { get; set; }

    public int UniqueDevices { get; set; }

    public Poi Poi { get; set; } = null!;
}
