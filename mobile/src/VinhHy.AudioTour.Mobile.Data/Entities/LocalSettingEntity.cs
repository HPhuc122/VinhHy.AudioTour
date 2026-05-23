using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Entities;

[Table("LocalSettings")]
public class LocalSettingEntity
{
    [PrimaryKey]
    [Column("Key")]
    public string Key { get; set; } = string.Empty;

    [Column("Value")]
    public string Value { get; set; } = string.Empty;

    [Column("UpdatedAt")]
    public DateTime UpdatedAt { get; set; }
}
