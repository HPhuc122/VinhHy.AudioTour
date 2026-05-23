using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Entities;

[Table("POITranslations")]
public class PoiTranslationEntity
{
    [PrimaryKey]
    [Column("Id")]
    public int Id { get; set; }

    [Column("POIId")]
    public int PoiId { get; set; }

    [Column("LanguageCode")]
    public string LanguageCode { get; set; } = string.Empty;

    [Column("Name")]
    public string Name { get; set; } = string.Empty;

    [Column("Description")]
    public string Description { get; set; } = string.Empty;

    [Column("ShortDescription")]
    public string? ShortDescription { get; set; }

    [Column("Version")]
    public int Version { get; set; } = 1;

    [Column("UpdatedAt")]
    public DateTime UpdatedAt { get; set; }
}
