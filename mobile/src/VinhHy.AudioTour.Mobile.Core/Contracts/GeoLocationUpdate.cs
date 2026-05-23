namespace VinhHy.AudioTour.Mobile.Core.Contracts;

public class GeoLocationUpdate
{
    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public double? AccuracyMeters { get; set; }

    public DateTime Timestamp { get; set; }
}
