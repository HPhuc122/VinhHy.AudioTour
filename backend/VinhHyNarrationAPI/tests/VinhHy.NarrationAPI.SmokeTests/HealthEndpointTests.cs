using System.Net;
using Xunit;

namespace VinhHy.NarrationAPI.SmokeTests;

[Collection(ApiCollection.Name)]
public class HealthEndpointTests(NarrationApiWebApplicationFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Health_ReturnsOk()
    {
        var response = await _client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Healthy", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task HealthReady_ReturnsOk()
    {
        var response = await _client.GetAsync("/health/ready");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
