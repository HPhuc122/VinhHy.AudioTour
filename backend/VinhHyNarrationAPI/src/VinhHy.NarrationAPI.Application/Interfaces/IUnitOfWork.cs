namespace VinhHy.NarrationAPI.Application.Interfaces;

public interface IUnitOfWork
{
    IUserRepository Users { get; }

    IRoleRepository Roles { get; }

    ILanguageRepository Languages { get; }

    IDeviceRepository Devices { get; }

    IPoiRepository Pois { get; }

    IPoiTranslationRepository PoiTranslations { get; }

    IAudioTrackRepository AudioTracks { get; }

    IMediaRepository MediaFiles { get; }

    ITourRepository Tours { get; }

    ITourTranslationRepository TourTranslations { get; }

    ITourPoiRepository TourPois { get; }

    IQrRepository QrLocations { get; }

    INarrationLogRepository NarrationLogs { get; }

    IOfflinePackageRepository OfflinePackages { get; }

    ISyncRepository Sync { get; }

    IDeletedRecordRepository DeletedRecords { get; }

    IAuditLogRepository AuditLogs { get; }

    IAnalyticsRepository Analytics { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
