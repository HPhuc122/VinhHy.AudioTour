using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _db;

    public UnitOfWork(
        ApplicationDbContext db,
        IUserRepository users,
        IRoleRepository roles,
        ILanguageRepository languages,
        IDeviceRepository devices,
        IPoiRepository pois,
        IPoiTranslationRepository poiTranslations,
        IAudioTrackRepository audioTracks,
        IMediaRepository mediaFiles,
        ITourRepository tours,
        ITourTranslationRepository tourTranslations,
        ITourPoiRepository tourPois,
        IQrRepository qrLocations,
        IGuestAccessPassRepository guestAccessPasses,
        IAccessPaymentSessionRepository accessPaymentSessions,
        INarrationLogRepository narrationLogs,
        IOfflinePackageRepository offlinePackages,
        ISyncRepository sync,
        IDeletedRecordRepository deletedRecords,
        IAuditLogRepository auditLogs,
        IAnalyticsRepository analytics)
    {
        _db = db;
        Users = users;
        Roles = roles;
        Languages = languages;
        Devices = devices;
        Pois = pois;
        PoiTranslations = poiTranslations;
        AudioTracks = audioTracks;
        MediaFiles = mediaFiles;
        Tours = tours;
        TourTranslations = tourTranslations;
        TourPois = tourPois;
        QrLocations = qrLocations;
        GuestAccessPasses = guestAccessPasses;
        AccessPaymentSessions = accessPaymentSessions;
        NarrationLogs = narrationLogs;
        OfflinePackages = offlinePackages;
        Sync = sync;
        DeletedRecords = deletedRecords;
        AuditLogs = auditLogs;
        Analytics = analytics;
    }

    public IUserRepository Users { get; }

    public IRoleRepository Roles { get; }

    public ILanguageRepository Languages { get; }

    public IDeviceRepository Devices { get; }

    public IPoiRepository Pois { get; }

    public IPoiTranslationRepository PoiTranslations { get; }

    public IAudioTrackRepository AudioTracks { get; }

    public IMediaRepository MediaFiles { get; }

    public ITourRepository Tours { get; }

    public ITourTranslationRepository TourTranslations { get; }

    public ITourPoiRepository TourPois { get; }

    public IQrRepository QrLocations { get; }

    public IGuestAccessPassRepository GuestAccessPasses { get; }

    public IAccessPaymentSessionRepository AccessPaymentSessions { get; }

    public INarrationLogRepository NarrationLogs { get; }

    public IOfflinePackageRepository OfflinePackages { get; }

    public ISyncRepository Sync { get; }

    public IDeletedRecordRepository DeletedRecords { get; }

    public IAuditLogRepository AuditLogs { get; }

    public IAnalyticsRepository Analytics { get; }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _db.SaveChangesAsync(cancellationToken);
}
