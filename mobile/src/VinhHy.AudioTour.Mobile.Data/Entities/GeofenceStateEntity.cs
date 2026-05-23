using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Entities;

[Table("GeofenceState")]
public class GeofenceStateEntity
{
    [PrimaryKey]
    [Column("POIId")]
    public int PoiId { get; set; }

    [Column("LastTriggeredAt")]
    public DateTime? LastTriggeredAt { get; set; }

    [Column("CooldownUntil")]
    public DateTime? CooldownUntil { get; set; }

    [Column("EnteredAt")]
    public DateTime? EnteredAt { get; set; }

    [Column("IsInsideRadius")]
    public bool IsInsideRadius { get; set; }
}
