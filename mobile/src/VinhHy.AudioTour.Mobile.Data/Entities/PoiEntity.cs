using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Entities;

[Table("POIs")]
public class PoiEntity
{
    [PrimaryKey]
    [Column("Id")]
    public int Id { get; set; }

    [Column("Code")]
    public string Code { get; set; } = string.Empty;

    [Column("Latitude")]
    public double Latitude { get; set; }

    [Column("Longitude")]
    public double Longitude { get; set; }

    [Column("RadiusMeters")]
    public double RadiusMeters { get; set; } = 30;

    [Column("Priority")]
    public int Priority { get; set; } = 1;

    [Column("IsActive")]
    public bool IsActive { get; set; } = true;

    [Column("ImageUrl")]
    public string? ImageUrl { get; set; }

    [Column("Category")]
    public string? Category { get; set; }

    [Column("CooldownSeconds")]
    public int CooldownSeconds { get; set; } = 300;

    [Column("MinDwellSeconds")]
    public int MinDwellSeconds { get; set; } = 5;

    [Column("DeletedAt")]
    public DateTime? DeletedAt { get; set; }

    [Column("Version")]
    public int Version { get; set; } = 1;

    [Column("UpdatedAt")]
    public DateTime UpdatedAt { get; set; }

    [Column("SyncedAt")]
    public DateTime SyncedAt { get; set; }
}
