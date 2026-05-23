using VinhHy.AudioTour.Mobile.Core.Api.Sync;
using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Mapping;

public static class SyncDtoMapper
{
    public static PoiLocal ToLocal(SyncablePoiDto dto)
    {
        var now = DateTime.UtcNow;
        return new PoiLocal
        {
            Id = dto.Id,
            Code = dto.Code,
            Latitude = (double)dto.Latitude,
            Longitude = (double)dto.Longitude,
            RadiusMeters = (double)dto.RadiusMeters,
            Priority = dto.Priority,
            IsActive = dto.IsActive,
            ImageUrl = dto.ImageUrl,
            Category = dto.Category,
            CooldownSeconds = dto.CooldownSeconds,
            MinDwellSeconds = dto.MinDwellSeconds,
            DeletedAt = dto.DeletedAt,
            Version = dto.Version,
            UpdatedAt = dto.UpdatedAt,
            SyncedAt = now
        };
    }

    public static PoiTranslationLocal ToLocal(SyncablePoiTranslationDto dto) =>
        new()
        {
            Id = dto.Id,
            PoiId = dto.PoiId,
            LanguageCode = dto.LanguageCode,
            Name = dto.Name,
            Description = dto.Description,
            ShortDescription = dto.ShortDescription,
            Version = dto.Version,
            UpdatedAt = dto.UpdatedAt
        };

    public static AudioTrackLocal ToLocal(SyncableAudioTrackDto dto) =>
        new()
        {
            Id = dto.Id,
            PoiId = dto.PoiId,
            LanguageCode = dto.LanguageCode,
            AudioType = dto.AudioType,
            FileUrl = dto.FileUrl,
            TtsText = dto.TtsText,
            DurationSeconds = dto.DurationSeconds,
            FileSizeBytes = dto.FileSizeBytes,
            MimeType = dto.MimeType,
            IsActive = dto.IsActive,
            DeletedAt = dto.DeletedAt,
            Version = dto.Version,
            UpdatedAt = dto.UpdatedAt
        };

    public static TourLocal ToLocal(SyncableTourDto dto) =>
        new()
        {
            Id = dto.Id,
            Code = dto.Code,
            DefaultLanguage = dto.DefaultLanguage,
            IsActive = dto.IsActive,
            EstimatedMinutes = dto.EstimatedMinutes,
            DeletedAt = dto.DeletedAt,
            Version = dto.Version,
            UpdatedAt = dto.UpdatedAt
        };

    public static TourTranslationLocal ToLocal(SyncableTourTranslationDto dto) =>
        new()
        {
            Id = dto.Id,
            TourId = dto.TourId,
            LanguageCode = dto.LanguageCode,
            Name = dto.Name,
            Description = dto.Description
        };

    public static OfflinePackageLocal ToLocal(SyncableOfflinePackageDto dto) =>
        new()
        {
            Id = dto.Id,
            TourId = dto.TourId,
            LanguageCode = dto.LanguageCode,
            PackageVersion = dto.PackageVersion,
            DownloadUrl = dto.DownloadUrl,
            FileSizeBytes = dto.FileSizeBytes,
            Checksum = dto.Checksum,
            IsActive = dto.IsActive,
            PublishedAt = dto.PublishedAt
        };

    public static DeletedRecordLocal ToLocal(DeletedRecordDto dto) =>
        new()
        {
            EntityType = dto.EntityType,
            EntityId = dto.EntityId,
            DeletedAt = dto.DeletedAt
        };
}
