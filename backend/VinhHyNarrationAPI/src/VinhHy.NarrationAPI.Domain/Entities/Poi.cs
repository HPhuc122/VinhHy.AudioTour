using VinhHy.NarrationAPI.Domain.Common;

namespace VinhHy.NarrationAPI.Domain.Entities;

public class Poi : SyncableEntity
{
    public string Code { get; set; } = null!;

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public decimal RadiusMeters { get; set; } = 30;

    public int Priority { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    public string? ImageUrl { get; set; }

    public string? Category { get; set; }

    public int CooldownSeconds { get; set; } = 300;

    public int MinDwellSeconds { get; set; } = 5;

    public ICollection<PoiTranslation> Translations { get; set; } = [];

    public ICollection<AudioTrack> AudioTracks { get; set; } = [];

    public ICollection<TourPoi> TourPois { get; set; } = [];

    public ICollection<QrLocation> QrLocations { get; set; } = [];

    public ICollection<NarrationLog> NarrationLogs { get; set; } = [];

    public ICollection<AnalyticsDaily> AnalyticsDaily { get; set; } = [];
}
