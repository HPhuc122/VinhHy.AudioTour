using Microsoft.Extensions.DependencyInjection;
using VinhHy.AudioTour.Mobile.Configuration;
using VinhHy.AudioTour.Mobile.Core.Constants;
using VinhHy.AudioTour.Mobile.Core.Contracts.Services;
using VinhHy.AudioTour.Mobile.Data.DependencyInjection;
using VinhHy.AudioTour.Mobile.Http;
using VinhHy.AudioTour.Mobile.Services;
using VinhHy.AudioTour.Mobile.ViewModels;

namespace VinhHy.AudioTour.Mobile.DependencyInjection;

public static class MobileServiceCollectionExtensions
{
    public static MauiAppBuilder AddMobileApp(this MauiAppBuilder builder)
    {
        builder.Services.AddMobileData();

        builder.Services.Configure<ApiOptions>(
            builder.Configuration.GetSection(ApiOptions.SectionName));

        RegisterHttpClients(builder.Services);

        builder.Services.AddSingleton<IAuthTokenStore, SecureAuthTokenStore>();
        builder.Services.AddSingleton<IAuthSessionProvider, AuthSessionProvider>();
        builder.Services.AddSingleton<IAuthService, AuthService>();

        builder.Services.AddSingleton<ILocalSettingsService, LocalSettingsService>();
        builder.Services.AddSingleton<IDeviceIdentityService, DeviceIdentityService>();
        builder.Services.AddSingleton<IConnectivityMonitor, ConnectivityMonitorService>();
        builder.Services.AddSingleton<INarrationLogQueueService, NarrationLogQueueService>();
        builder.Services.AddSingleton<ISyncService, SyncOrchestratorService>();
        builder.Services.AddSingleton<IOfflineSyncCoordinator, OfflineSyncCoordinatorService>();
        builder.Services.AddSingleton<IAudioPlaybackService, AudioPlaybackService>();
        builder.Services.AddSingleton<IGpsTrackingService, GpsTrackingService>();
        builder.Services.AddSingleton<IBackgroundTourService, BackgroundTourService>();
        builder.Services.AddSingleton<IAppBootstrapService, AppBootstrapService>();

        builder.Services.AddTransient<HomeViewModel>();
        builder.Services.AddTransient<SettingsViewModel>();
        builder.Services.AddTransient<SyncStatusViewModel>();

        builder.Services.AddTransient<Views.HomePage>();
        builder.Services.AddTransient<Views.SettingsPage>();
        builder.Services.AddTransient<Views.SyncStatusPage>();

        builder.Services.AddSingleton<AppShell>();

        return builder;
    }

    private static void RegisterHttpClients(IServiceCollection services)
    {
        services.AddTransient<AuthenticatedHttpMessageHandler>();

        services.AddHttpClient(HttpClientNames.Auth, HttpClientConfiguration.ConfigureApiClient);
        services.AddHttpClient(HttpClientNames.Api, HttpClientConfiguration.ConfigureApiClient)
            .AddHttpMessageHandler<AuthenticatedHttpMessageHandler>();

        services.AddHttpClient<IApiClient, NarrationApiClient>(HttpClientNames.Api);
    }
}
