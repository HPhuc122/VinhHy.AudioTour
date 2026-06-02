using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Entities;

[Table("Languages")]
public sealed class LanguageEntity
{
    [PrimaryKey]
    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string NativeName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; }
}
