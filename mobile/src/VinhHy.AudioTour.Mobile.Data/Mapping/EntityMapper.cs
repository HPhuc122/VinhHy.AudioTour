using VinhHy.AudioTour.Mobile.Core.Models;
using VinhHy.AudioTour.Mobile.Data.Entities;

namespace VinhHy.AudioTour.Mobile.Data.Mapping;

public static class EntityMapper
{
    public static LocalSettingEntry ToLocal(LocalSettingEntity entity) => new()
    {
        Key = entity.Key,
        Value = entity.Value,
        UpdatedAt = entity.UpdatedAt,
    };

    public static LocalSettingEntity FromLocal(LocalSettingEntry model) => new()
    {
        Key = model.Key,
        Value = model.Value,
        UpdatedAt = model.UpdatedAt,
    };

    public static DeviceRegistrationLocal ToLocal(DeviceRegistrationEntity entity) => new()
    {
        DeviceId = entity.DeviceId,
        Platform = entity.Platform,
        AppVersion = entity.AppVersion,
        OsVersion = entity.OsVersion,
        PushToken = entity.PushToken,
        RegisteredAt = entity.RegisteredAt,
        LastSyncedAt = entity.LastSyncedAt,
    };

    public static DeviceRegistrationEntity FromLocal(DeviceRegistrationLocal model) => new()
    {
        DeviceId = model.DeviceId,
        Platform = model.Platform,
        AppVersion = model.AppVersion,
        OsVersion = model.OsVersion,
        PushToken = model.PushToken,
        RegisteredAt = model.RegisteredAt,
        LastSyncedAt = model.LastSyncedAt,
    };

    public static PoiLocal ToLocal(PoiEntity entity) => new()
    {
        Id = entity.Id,
        Code = entity.Code,
        Latitude = entity.Latitude,
        Longitude = entity.Longitude,
        RadiusMeters = entity.RadiusMeters,
        Priority = entity.Priority,
        IsActive = entity.IsActive,
        ImageUrl = entity.ImageUrl,
        Category = entity.Category,
        CooldownSeconds = entity.CooldownSeconds,
        MinDwellSeconds = entity.MinDwellSeconds,
        DeletedAt = entity.DeletedAt,
        Version = entity.Version,
        UpdatedAt = entity.UpdatedAt,
        SyncedAt = entity.SyncedAt,
    };

    public static PoiEntity FromLocal(PoiLocal model) => new()
    {
        Id = model.Id,
        Code = model.Code,
        Latitude = model.Latitude,
        Longitude = model.Longitude,
        RadiusMeters = model.RadiusMeters,
        Priority = model.Priority,
        IsActive = model.IsActive,
        ImageUrl = model.ImageUrl,
        Category = model.Category,
        CooldownSeconds = model.CooldownSeconds,
        MinDwellSeconds = model.MinDwellSeconds,
        DeletedAt = model.DeletedAt,
        Version = model.Version,
        UpdatedAt = model.UpdatedAt,
        SyncedAt = model.SyncedAt,
    };

    public static PoiTranslationLocal ToLocal(PoiTranslationEntity entity) => new()
    {
        Id = entity.Id,
        PoiId = entity.PoiId,
        LanguageCode = entity.LanguageCode,
        Name = entity.Name,
        Description = entity.Description,
        ShortDescription = entity.ShortDescription,
        Version = entity.Version,
        UpdatedAt = entity.UpdatedAt,
    };

    public static PoiTranslationEntity FromLocal(PoiTranslationLocal model) => new()
    {
        Id = model.Id,
        PoiId = model.PoiId,
        LanguageCode = model.LanguageCode,
        Name = model.Name,
        Description = model.Description,
        ShortDescription = model.ShortDescription,
        Version = model.Version,
        UpdatedAt = model.UpdatedAt,
    };

    public static AudioTrackLocal ToLocal(AudioTrackEntity entity) => new()
    {
        Id = entity.Id,
        PoiId = entity.PoiId,
        LanguageCode = entity.LanguageCode,
        AudioType = entity.AudioType,
        FileUrl = entity.FileUrl,
        TtsText = entity.TtsText,
        DurationSeconds = entity.DurationSeconds,
        FileSizeBytes = entity.FileSizeBytes,
        MimeType = entity.MimeType,
        IsActive = entity.IsActive,
        IsDownloaded = entity.IsDownloaded,
        LocalFilePath = entity.LocalFilePath,
        DeletedAt = entity.DeletedAt,
        Version = entity.Version,
        UpdatedAt = entity.UpdatedAt,
    };

    public static AudioTrackEntity FromLocal(AudioTrackLocal model) => new()
    {
        Id = model.Id,
        PoiId = model.PoiId,
        LanguageCode = model.LanguageCode,
        AudioType = model.AudioType,
        FileUrl = model.FileUrl,
        TtsText = model.TtsText,
        DurationSeconds = model.DurationSeconds,
        FileSizeBytes = model.FileSizeBytes,
        MimeType = model.MimeType,
        IsActive = model.IsActive,
        IsDownloaded = model.IsDownloaded,
        LocalFilePath = model.LocalFilePath,
        DeletedAt = model.DeletedAt,
        Version = model.Version,
        UpdatedAt = model.UpdatedAt,
    };

    public static TourLocal ToLocal(TourEntity entity) => new()
    {
        Id = entity.Id,
        Code = entity.Code,
        DefaultLanguage = entity.DefaultLanguage,
        IsActive = entity.IsActive,
        EstimatedMinutes = entity.EstimatedMinutes,
        DeletedAt = entity.DeletedAt,
        Version = entity.Version,
        UpdatedAt = entity.UpdatedAt,
    };

    public static TourEntity FromLocal(TourLocal model) => new()
    {
        Id = model.Id,
        Code = model.Code,
        DefaultLanguage = model.DefaultLanguage,
        IsActive = model.IsActive,
        EstimatedMinutes = model.EstimatedMinutes,
        DeletedAt = model.DeletedAt,
        Version = model.Version,
        UpdatedAt = model.UpdatedAt,
    };

    public static TourTranslationLocal ToLocal(TourTranslationEntity entity) => new()
    {
        Id = entity.Id,
        TourId = entity.TourId,
        LanguageCode = entity.LanguageCode,
        Name = entity.Name,
        Description = entity.Description,
    };

    public static TourTranslationEntity FromLocal(TourTranslationLocal model) => new()
    {
        Id = model.Id,
        TourId = model.TourId,
        LanguageCode = model.LanguageCode,
        Name = model.Name,
        Description = model.Description,
    };

    public static OfflinePackageLocal ToLocal(OfflinePackageEntity entity) => new()
    {
        Id = entity.Id,
        TourId = entity.TourId,
        LanguageCode = entity.LanguageCode,
        PackageVersion = entity.PackageVersion,
        DownloadUrl = entity.DownloadUrl,
        FileSizeBytes = entity.FileSizeBytes,
        Checksum = entity.Checksum,
        IsDownloaded = entity.IsDownloaded,
        IsActive = entity.IsActive,
        DownloadedAt = entity.DownloadedAt,
        PublishedAt = entity.PublishedAt,
    };

    public static OfflinePackageEntity FromLocal(OfflinePackageLocal model) => new()
    {
        Id = model.Id,
        TourId = model.TourId,
        LanguageCode = model.LanguageCode,
        PackageVersion = model.PackageVersion,
        DownloadUrl = model.DownloadUrl,
        FileSizeBytes = model.FileSizeBytes,
        Checksum = model.Checksum,
        IsDownloaded = model.IsDownloaded,
        IsActive = model.IsActive,
        DownloadedAt = model.DownloadedAt,
        PublishedAt = model.PublishedAt,
    };

    public static NarrationLogLocal ToLocal(NarrationLogEntity entity) => new()
    {
        Id = entity.Id,
        ServerId = entity.ServerId,
        PoiId = entity.PoiId,
        TriggerType = entity.TriggerType,
        LanguageCode = entity.LanguageCode,
        PlayedAt = entity.PlayedAt,
        DurationPlayedSeconds = entity.DurationPlayedSeconds,
        DeviceId = entity.DeviceId,
        Synced = entity.Synced,
        SyncedAt = entity.SyncedAt,
    };

    public static NarrationLogEntity FromLocal(NarrationLogLocal model) => new()
    {
        Id = model.Id,
        ServerId = model.ServerId,
        PoiId = model.PoiId,
        TriggerType = model.TriggerType,
        LanguageCode = model.LanguageCode,
        PlayedAt = model.PlayedAt,
        DurationPlayedSeconds = model.DurationPlayedSeconds,
        DeviceId = model.DeviceId,
        Synced = model.Synced,
        SyncedAt = model.SyncedAt,
    };

    public static DeletedRecordLocal ToLocal(DeletedRecordEntity entity) => new()
    {
        Id = entity.Id,
        EntityType = entity.EntityType,
        EntityId = entity.EntityId,
        DeletedAt = entity.DeletedAt,
        ProcessedAt = entity.ProcessedAt,
    };

    public static DeletedRecordEntity FromLocal(DeletedRecordLocal model) => new()
    {
        Id = model.Id,
        EntityType = model.EntityType,
        EntityId = model.EntityId,
        DeletedAt = model.DeletedAt,
        ProcessedAt = model.ProcessedAt,
    };

    public static GeofenceStateLocal ToLocal(GeofenceStateEntity entity) => new()
    {
        PoiId = entity.PoiId,
        LastTriggeredAt = entity.LastTriggeredAt,
        CooldownUntil = entity.CooldownUntil,
        EnteredAt = entity.EnteredAt,
        IsInsideRadius = entity.IsInsideRadius,
    };

    public static GeofenceStateEntity FromLocal(GeofenceStateLocal model) => new()
    {
        PoiId = model.PoiId,
        LastTriggeredAt = model.LastTriggeredAt,
        CooldownUntil = model.CooldownUntil,
        EnteredAt = model.EnteredAt,
        IsInsideRadius = model.IsInsideRadius,
    };

    public static SyncCursorLocal ToLocal(SyncCursorEntity entity) => new()
    {
        EntityType = entity.EntityType,
        LastSyncedAt = entity.LastSyncedAt,
    };

    public static SyncCursorEntity FromLocal(SyncCursorLocal model) => new()
    {
        EntityType = model.EntityType,
        LastSyncedAt = model.LastSyncedAt,
    };
}
