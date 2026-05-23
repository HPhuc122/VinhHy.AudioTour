using Microsoft.Extensions.Configuration;
using VinhHy.AudioTour.Mobile.DependencyInjection;

namespace VinhHy.AudioTour.Mobile;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();

        try
        {
            using var stream = FileSystem.OpenAppPackageFileAsync("appsettings.json")
                .GetAwaiter()
                .GetResult();
            builder.Configuration.AddJsonStream(stream);
        }
        catch (FileNotFoundException)
        {
            // Optional packaged config.
        }

        builder
            .UseMauiApp<App>()
            .ConfigureEssentials(essentials =>
            {
                essentials.UseVersionTracking();
            })
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        builder.AddMobileApp();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
