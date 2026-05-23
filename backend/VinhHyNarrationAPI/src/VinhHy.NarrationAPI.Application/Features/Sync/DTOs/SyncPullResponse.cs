namespace VinhHy.NarrationAPI.Application.Features.Sync.DTOs;

public class SyncPullResponse
{
    public DateTime ServerTimestamp { get; set; }

    public IReadOnlyList<SyncablePoiDto> Pois { get; set; } = [];

    public IReadOnlyList<SyncablePoiTranslationDto> PoiTranslations { get; set; } = [];

    public IReadOnlyList<SyncableAudioTrackDto> AudioTracks { get; set; } = [];

    public IReadOnlyList<SyncableTourDto> Tours { get; set; } = [];

    public IReadOnlyList<SyncableTourTranslationDto> TourTranslations { get; set; } = [];

    public IReadOnlyList<SyncableQrLocationDto> QrLocations { get; set; } = [];

    public IReadOnlyList<SyncableLanguageDto> Languages { get; set; } = [];

    public IReadOnlyList<SyncableOfflinePackageDto> OfflinePackages { get; set; } = [];

    public IReadOnlyList<DeletedRecordDto> DeletedRecords { get; set; } = [];
}
