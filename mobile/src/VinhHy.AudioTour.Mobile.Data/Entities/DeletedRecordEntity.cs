using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Entities;

[Table("DeletedRecords")]
public class DeletedRecordEntity
{
    [PrimaryKey]
    [AutoIncrement]
    [Column("Id")]
    public long Id { get; set; }

    [Column("EntityType")]
    public string EntityType { get; set; } = string.Empty;

    [Column("EntityId")]
    public int EntityId { get; set; }

    [Column("DeletedAt")]
    public DateTime DeletedAt { get; set; }

    [Column("ProcessedAt")]
    public DateTime? ProcessedAt { get; set; }
}
