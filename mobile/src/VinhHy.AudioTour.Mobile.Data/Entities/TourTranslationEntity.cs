using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Entities;

[Table("TourTranslations")]
public class TourTranslationEntity
{
    [PrimaryKey]
    [Column("Id")]
    public int Id { get; set; }

    [Column("TourId")]
    public int TourId { get; set; }

    [Column("LanguageCode")]
    public string LanguageCode { get; set; } = string.Empty;

    [Column("Name")]
    public string Name { get; set; } = string.Empty;

    [Column("Description")]
    public string? Description { get; set; }
}
