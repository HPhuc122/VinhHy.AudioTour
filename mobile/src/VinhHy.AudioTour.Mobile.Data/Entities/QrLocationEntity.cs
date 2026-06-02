using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Entities;

[Table("QRLocations")]
public sealed class QrLocationEntity
{
    [PrimaryKey]
    public int Id { get; set; }

    [Indexed(Name = "IX_QRLocations_POIId", Order = 1)]
    public int POIId { get; set; }

    public string QRCode { get; set; } = string.Empty;

    public string? Label { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }
}
