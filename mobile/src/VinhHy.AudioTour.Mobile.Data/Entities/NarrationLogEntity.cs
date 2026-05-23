using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Entities;

[Table("NarrationLogs")]
public class NarrationLogEntity
{
    [PrimaryKey]
    [AutoIncrement]
    [Column("Id")]
    public long Id { get; set; }

    [Column("ServerId")]
    public int? ServerId { get; set; }

    [Column("POIId")]
    public int PoiId { get; set; }

    [Column("TriggerType")]
    public string TriggerType { get; set; } = string.Empty;

    [Column("LanguageCode")]
    public string LanguageCode { get; set; } = string.Empty;

    [Column("PlayedAt")]
    public DateTime PlayedAt { get; set; }

    [Column("DurationPlayedSeconds")]
    public int? DurationPlayedSeconds { get; set; }

    [Column("DeviceId")]
    public string? DeviceId { get; set; }

    [Column("Synced")]
    public bool Synced { get; set; }

    [Column("SyncedAt")]
    public DateTime? SyncedAt { get; set; }
}
