using Microsoft.Extensions.DependencyInjection;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using Xunit;

namespace VinhHy.NarrationAPI.SmokeTests;

[Collection(ApiCollection.Name)]
public class DependencyInjectionTests(NarrationApiWebApplicationFactory factory)
{
    [Fact]
    public void AllApplicationServices_AreRegistered()
    {
        using var scope = factory.Services.CreateScope();
        var services = scope.ServiceProvider;

        Assert.NotNull(services.GetService<IAuthService>());
        Assert.NotNull(services.GetService<IUserService>());
        Assert.NotNull(services.GetService<IPoiService>());
        Assert.NotNull(services.GetService<IPoiTranslationService>());
        Assert.NotNull(services.GetService<IAudioService>());
        Assert.NotNull(services.GetService<ITourService>());
        Assert.NotNull(services.GetService<IQrService>());
        Assert.NotNull(services.GetService<ISyncService>());
        Assert.NotNull(services.GetService<IOfflinePackageService>());
        Assert.NotNull(services.GetService<IAnalyticsService>());
        Assert.NotNull(services.GetService<INarrationLogService>());
        Assert.NotNull(services.GetService<IGeofenceConfigService>());
        Assert.NotNull(services.GetService<IAuditService>());
        Assert.NotNull(services.GetService<ILanguageService>());
        Assert.NotNull(services.GetService<IDeviceService>());
        Assert.NotNull(services.GetService<IUnitOfWork>());
    }
}
