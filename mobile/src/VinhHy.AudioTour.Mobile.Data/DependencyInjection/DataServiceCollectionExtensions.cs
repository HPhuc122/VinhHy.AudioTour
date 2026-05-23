using Microsoft.Extensions.DependencyInjection;
using VinhHy.AudioTour.Mobile.Core.Contracts.Repositories;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;
using VinhHy.AudioTour.Mobile.Data.Database;
using VinhHy.AudioTour.Mobile.Data.Repositories;

namespace VinhHy.AudioTour.Mobile.Data.DependencyInjection;

public static class DataServiceCollectionExtensions
{
    public static IServiceCollection AddMobileData(this IServiceCollection services)
    {
        services.AddSingleton<LocalDatabase>();
        services.AddSingleton<ILocalDatabaseInitializer, LocalDatabaseInitializer>();

        services.AddSingleton<ITourRepository, TourRepository>();
        services.AddSingleton<IPoiRepository, PoiRepository>();
        services.AddSingleton<IPoiTranslationRepository, PoiTranslationRepository>();
        services.AddSingleton<IAudioTrackRepository, AudioTrackRepository>();
        services.AddSingleton<IOfflinePackageRepository, OfflinePackageRepository>();
        services.AddSingleton<INarrationLogRepository, NarrationLogRepository>();
        services.AddSingleton<ISyncCursorRepository, SyncCursorRepository>();
        services.AddSingleton<IGeofenceStateRepository, GeofenceStateRepository>();
        services.AddSingleton<ILocalSettingsRepository, LocalSettingsRepository>();
        services.AddSingleton<IDeviceRegistrationRepository, DeviceRegistrationRepository>();
        services.AddSingleton<IDeletedRecordRepository, DeletedRecordRepository>();

        services.AddSingleton<ITourTranslationRepository, TourTranslationRepository>();

        return services;
    }
}
