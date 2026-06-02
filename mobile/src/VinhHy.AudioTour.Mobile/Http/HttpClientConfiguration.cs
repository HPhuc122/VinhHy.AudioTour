using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using VinhHy.AudioTour.Mobile.Configuration;
using VinhHy.AudioTour.Mobile.Core.Constants;

namespace VinhHy.AudioTour.Mobile.Http;

internal static class HttpClientConfiguration
{
    public static void ConfigureApiClient(IServiceProvider services, HttpClient client)
    {
        var options = services.GetRequiredService<IOptions<ApiOptions>>().Value;
        client.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/') + "/");
        client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
    }
}
