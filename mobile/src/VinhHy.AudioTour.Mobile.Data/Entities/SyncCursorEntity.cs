using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Entities;

[Table("SyncCursors")]
public class SyncCursorEntity
{
    [PrimaryKey]
    [Column("EntityType")]
    public string EntityType { get; set; } = string.Empty;

    [Column("LastSyncedAt")]
    public DateTime LastSyncedAt { get; set; }
}
