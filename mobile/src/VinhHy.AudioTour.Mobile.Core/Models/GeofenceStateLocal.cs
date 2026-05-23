namespace VinhHy.AudioTour.Mobile.Core.Models;

public class GeofenceStateLocal
{
    public int PoiId { get; set; }

    public DateTime? LastTriggeredAt { get; set; }

    public DateTime? CooldownUntil { get; set; }

    public DateTime? EnteredAt { get; set; }

    public bool IsInsideRadius { get; set; }
}
