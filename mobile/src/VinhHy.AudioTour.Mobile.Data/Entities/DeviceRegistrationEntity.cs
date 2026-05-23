using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Entities;

[Table("DeviceRegistration")]
public class DeviceRegistrationEntity
{
    [PrimaryKey]
    [Column("DeviceId")]
    public string DeviceId { get; set; } = string.Empty;

    [Column("Platform")]
    public string Platform { get; set; } = string.Empty;

    [Column("AppVersion")]
    public string? AppVersion { get; set; }

    [Column("OsVersion")]
    public string? OsVersion { get; set; }

    [Column("PushToken")]
    public string? PushToken { get; set; }

    [Column("RegisteredAt")]
    public DateTime RegisteredAt { get; set; }

    [Column("LastSyncedAt")]
    public DateTime? LastSyncedAt { get; set; }
}
