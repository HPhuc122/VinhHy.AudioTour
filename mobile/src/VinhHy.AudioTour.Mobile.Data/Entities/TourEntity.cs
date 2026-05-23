using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Entities;

[Table("Tours")]
public class TourEntity
{
    [PrimaryKey]
    [Column("Id")]
    public int Id { get; set; }

    [Column("Code")]
    public string Code { get; set; } = string.Empty;

    [Column("DefaultLanguage")]
    public string DefaultLanguage { get; set; } = "vi";

    [Column("IsActive")]
    public bool IsActive { get; set; } = true;

    [Column("EstimatedMinutes")]
    public int? EstimatedMinutes { get; set; }

    [Column("DeletedAt")]
    public DateTime? DeletedAt { get; set; }

    [Column("Version")]
    public int Version { get; set; } = 1;

    [Column("UpdatedAt")]
    public DateTime UpdatedAt { get; set; }
}
